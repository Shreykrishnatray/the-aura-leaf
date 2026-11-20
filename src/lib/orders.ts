import { z } from "zod";
import { getPrisma } from "./prisma";
import type { Customization, Order, OrderItem, OrderStatus } from "@/types";

/**
 * Phase 3 order service.
 *
 * Every mutation validates its input, re-reads prices and modifier options from
 * MySQL (never trusting client-side totals), and writes through a Prisma
 * transaction so an order can never be half-created.
 */

export class OrderError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "OrderError";
    this.status = status;
  }
}

const ORDER_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "SERVED",
  "CANCELLED",
] as const;

/** Allowed status transitions. Anything else is rejected as a conflict. */
const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["SERVED", "CANCELLED"],
  SERVED: [],
  CANCELLED: [],
};

const MAX_ITEMS_PER_ORDER = 50;
const MAX_QUANTITY_PER_ITEM = 99;

const itemCustomizationSchema = z.object({
  modifierId: z.string().trim().min(1).max(64),
  optionIds: z
    .array(z.string().trim().min(1).max(64))
    .min(1, "Select at least one option.")
    .max(10),
});

const orderItemSchema = z.object({
  menuItemId: z.string().trim().min(1).max(64),
  quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_ITEM),
  specialInstructions: z.string().trim().max(500).optional().default(""),
  customizations: z.array(itemCustomizationSchema).max(20).optional().default([]),
});

export const createOrderSchema = z.object({
  sessionId: z
    .string()
    .trim()
    .min(4, "A valid dining session is required.")
    .max(64)
    .regex(/^[A-Za-z0-9_-]+$/, "Invalid dining session id."),
  sessionIdentifier: z.string().trim().min(1).max(64),
  tableNumber: z
    .string()
    .trim()
    .min(1)
    .max(16)
    .regex(/^[A-Za-z0-9-]+$/, "Invalid table number."),
  notes: z.string().trim().max(500).optional().default(""),
  items: z
    .array(orderItemSchema)
    .min(1, "Your cart is empty.")
    .max(MAX_ITEMS_PER_ORDER),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export function parseCreateOrderInput(value: unknown): CreateOrderInput {
  const result = createOrderSchema.safeParse(value);
  if (!result.success) {
    throw new OrderError(400, formatValidationError(result.error));
  }
  return result.data;
}

export function parseUpdateOrderStatusInput(value: unknown): UpdateOrderStatusInput {
  const result = updateOrderStatusSchema.safeParse(value);
  if (!result.success) {
    throw new OrderError(400, formatValidationError(result.error));
  }
  return result.data;
}

function formatValidationError(error: z.ZodError): string {
  const first = error.issues[0];
  if (!first) return "Invalid request body.";
  const path = first.path.length > 0 ? `${first.path.join(".")}: ` : "";
  return `${path}${first.message}`;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function generateOrderCode(): string {
  const suffix = Math.floor(Math.random() * 36 ** 6)
    .toString(36)
    .toUpperCase()
    .padStart(6, "0");
  return `OR-${suffix}`;
}

function normaliseSessionIdentifier(value: string): string {
  const trimmed = value.trim();
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

const orderInclude = {
  items: {
    include: { customizations: true },
    orderBy: { sortOrder: "asc" as const },
  },
};

type OrderWithItems = {
  id: string;
  sessionId: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  total: number;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  estimatedReadyAt: Date | null;
  servedAt: Date | null;
  items: {
    id: string;
    menuItemId: string;
    name: string;
    image: string;
    unitPrice: number;
    quantity: number;
    total: number;
    specialInstructions: string;
    customizations: {
      modifierId: string;
      modifierName: string;
      optionIds: unknown;
      optionNames: unknown;
      price: number;
    }[];
  }[];
};

function mapOrderItem(record: OrderWithItems["items"][number]): OrderItem {
  return {
    id: record.id,
    menuItemId: record.menuItemId,
    name: record.name,
    image: record.image,
    price: record.unitPrice,
    quantity: record.quantity,
    customizations: record.customizations.map(
      (customization): Customization => ({
        modifierId: customization.modifierId,
        modifierName: customization.modifierName,
        optionIds: toStringArray(customization.optionIds),
        optionNames: toStringArray(customization.optionNames),
        price: customization.price,
      })
    ),
    specialInstructions: record.specialInstructions,
    total: record.total,
  };
}

export function mapOrder(record: OrderWithItems): Order {
  return {
    id: record.id,
    sessionId: record.sessionId,
    status: record.status as OrderStatus,
    items: record.items.map(mapOrderItem),
    subtotal: record.subtotal,
    taxAmount: record.taxAmount,
    serviceCharge: record.serviceCharge,
    total: record.total,
    notes: record.notes,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    estimatedReadyAt: record.estimatedReadyAt ? record.estimatedReadyAt.toISOString() : null,
    servedAt: record.servedAt ? record.servedAt.toISOString() : null,
  };
}

/**
 * Creates an order for a table's dining session inside a single transaction.
 * The dining session row is created on demand the first time a table orders.
 */
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const prisma = getPrisma();

  try {
    const order = await prisma.$transaction(async (tx) => {
      const table = await tx.restaurantTable.findUnique({
        where: { number: input.tableNumber },
      });
      if (!table) {
        throw new OrderError(404, `Table ${input.tableNumber} was not found.`);
      }

      const restaurant = await tx.restaurant.findFirst({
        include: { taxes: true },
        orderBy: { createdAt: "asc" },
      });
      if (!restaurant) {
        throw new OrderError(503, "The restaurant is not configured yet.");
      }

      const existingSession = await tx.diningSession.findUnique({
        where: { id: input.sessionId },
      });

      if (existingSession && existingSession.tableId !== table.id) {
        throw new OrderError(409, "This dining session belongs to a different table.");
      }
      if (
        existingSession &&
        (existingSession.status === "COMPLETED" || existingSession.status === "CANCELLED")
      ) {
        throw new OrderError(409, "This dining session is closed. Start a new session to order.");
      }

      const session =
        existingSession ??
        (await tx.diningSession.create({
          data: {
            id: input.sessionId,
            sessionIdentifier: normaliseSessionIdentifier(input.sessionIdentifier),
            restaurantId: restaurant.id,
            tableId: table.id,
            status: "ACTIVE",
            restaurantLat: restaurant.latitude,
            restaurantLng: restaurant.longitude,
            allowedRadiusMeters: 80,
            locationStatus: "pending",
          },
        }));

      // ----- Resolve and validate every line against the database -----
      const menuItemIds = [...new Set(input.items.map((item) => item.menuItemId))];
      const menuItems = await tx.menuItem.findMany({
        where: { id: { in: menuItemIds } },
        include: {
          modifiers: {
            include: { modifier: { include: { options: true } } },
          },
        },
      });
      const menuById = new Map(menuItems.map((item) => [item.id, item]));

      const preparedItems = input.items.map((line, index) => {
        const menuItem = menuById.get(line.menuItemId);
        if (!menuItem) {
          throw new OrderError(400, `Unknown menu item: ${line.menuItemId}.`);
        }
        if (!menuItem.available) {
          throw new OrderError(409, `${menuItem.name} is currently unavailable.`);
        }

        const submittedByModifier = new Map<string, Set<string>>();

        for (const customization of line.customizations) {
          const attach = menuItem.modifiers.find(
            (join) => join.modifier.id === customization.modifierId
          );
          if (!attach) {
            throw new OrderError(
              400,
              `${customization.modifierId} is not an option for ${menuItem.name}.`
            );
          }
          if (submittedByModifier.has(customization.modifierId)) {
            throw new OrderError(
              400,
              `Duplicate customization for ${attach.modifier.name}.`
            );
          }
          if (attach.modifier.type === "single" && customization.optionIds.length > 1) {
            throw new OrderError(400, `${attach.modifier.name} allows only one choice.`);
          }

          const validOptionIds = new Set(attach.modifier.options.map((option) => option.id));
          const seenOptions = new Set<string>();
          for (const optionId of customization.optionIds) {
            if (!validOptionIds.has(optionId)) {
              throw new OrderError(
                400,
                `"${optionId}" is not a valid ${attach.modifier.name} option.`
              );
            }
            if (seenOptions.has(optionId)) {
              throw new OrderError(400, `Duplicate option "${optionId}".`);
            }
            seenOptions.add(optionId);
          }

          submittedByModifier.set(customization.modifierId, seenOptions);
        }

        for (const join of menuItem.modifiers) {
          if (
            join.modifier.required &&
            join.modifier.options.length > 0 &&
            !submittedByModifier.has(join.modifier.id)
          ) {
            throw new OrderError(
              400,
              `${join.modifier.name} is required for ${menuItem.name}.`
            );
          }
        }

        const customizations = menuItem.modifiers
          .map((join) => join.modifier)
          .filter((modifier) => submittedByModifier.has(modifier.id))
          .map((modifier) => {
            const selectedIds = submittedByModifier.get(modifier.id) ?? new Set<string>();
            const options = modifier.options.filter((option) => selectedIds.has(option.id));
            return {
              modifierId: modifier.id,
              modifierName: modifier.name,
              optionIds: options.map((option) => option.id),
              optionNames: options.map((option) => option.name),
              price: options.reduce((sum, option) => sum + option.price, 0),
            };
          });

        const customizationPrice = customizations.reduce((sum, c) => sum + c.price, 0);
        const unitPrice = menuItem.price + customizationPrice;
        const total = unitPrice * line.quantity;

        return {
          sortOrder: index,
          menuItemId: menuItem.id,
          name: menuItem.name,
          image: menuItem.image,
          unitPrice,
          quantity: line.quantity,
          total,
          specialInstructions: line.specialInstructions,
          customizations,
        };
      });

      // ----- Totals are computed server-side from database tax config -----
      const subtotal = preparedItems.reduce((sum, item) => sum + item.total, 0);
      const percentageRate = restaurant.taxes
        .filter((tax) => tax.type === "percentage")
        .reduce((sum, tax) => sum + tax.rate, 0);
      const fixedTax = restaurant.taxes
        .filter((tax) => tax.type === "fixed")
        .reduce((sum, tax) => sum + tax.rate, 0);
      const taxAmount = Math.round((subtotal * percentageRate) / 100) + fixedTax;
      const serviceCharge = Math.round((subtotal * restaurant.serviceCharge) / 100);
      const total = subtotal + taxAmount + serviceCharge;

      const created = await tx.order.create({
        data: {
          id: generateOrderCode(),
          sessionId: session.id,
          status: "PENDING",
          subtotal,
          taxAmount,
          serviceCharge,
          total,
          notes: input.notes,
          estimatedReadyAt: new Date(Date.now() + 20 * 60 * 1000),
          items: {
            create: preparedItems.map((item) => ({
              menuItemId: item.menuItemId,
              name: item.name,
              image: item.image,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              total: item.total,
              sortOrder: item.sortOrder,
              specialInstructions: item.specialInstructions,
              customizations: { create: item.customizations },
            })),
          },
        },
        include: orderInclude,
      });

      await tx.diningSession.update({
        where: { id: session.id },
        data: { runningTotal: { increment: total } },
      });

      await tx.restaurantTable.update({
        where: { id: table.id },
        data: { status: "occupied", sessionId: session.id },
      });

      return created;
    });

    return mapOrder(order as OrderWithItems);
  } catch (error) {
    if (error instanceof OrderError) throw error;
    if (isUniqueConstraintError(error)) {
      throw new OrderError(
        409,
        "This order could not be saved because of a duplicate reference. Please try again."
      );
    }
    throw error;
  }
}

export async function getOrdersBySession(sessionId: string): Promise<Order[]> {
  const prisma = getPrisma();
  const session = await prisma.diningSession.findUnique({
    where: { id: sessionId },
    select: { id: true },
  });
  if (!session) return [];

  const orders = await prisma.order.findMany({
    where: { sessionId },
    include: orderInclude,
    orderBy: { createdAt: "asc" },
  });

  return orders.map((order) => mapOrder(order as OrderWithItems));
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const prisma = getPrisma();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: orderInclude,
  });

  return order ? mapOrder(order as OrderWithItems) : null;
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<Order> {
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true },
    });
    if (!existing) {
      throw new OrderError(404, "Order not found.");
    }

    const current = existing.status as OrderStatus;
    if (current === status) {
      const unchanged = await tx.order.findUniqueOrThrow({
        where: { id: orderId },
        include: orderInclude,
      });
      return mapOrder(unchanged as OrderWithItems);
    }

    const allowed = STATUS_TRANSITIONS[current] ?? [];
    if (!allowed.includes(status)) {
      throw new OrderError(
        409,
        `An order that is ${current.toLowerCase()} cannot be marked ${status.toLowerCase()}.`
      );
    }

    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        status,
        servedAt: status === "SERVED" ? new Date() : undefined,
      },
      include: orderInclude,
    });

    return mapOrder(updated as OrderWithItems);
  });
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}
