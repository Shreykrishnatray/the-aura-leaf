import { z } from "zod";
import { getPrisma } from "./prisma";
import { mapOrder } from "./orders";
import type {
  Bill,
  BillItem,
  Payment,
  PaymentMethod,
  PaymentStatus,
} from "@/types";

/**
 * Phase 4 billing service.
 *
 * A bill snapshots the billable orders of one dining session together with the
 * tax and service-charge configuration at generation time. Payments are
 * recorded against the bill; a successful payment closes the session and frees
 * the table in the same transaction.
 */

export class BillError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "BillError";
    this.status = status;
  }
}

const PAYMENT_METHODS = ["card", "upi", "cash", "wallet"] as const;

export const payBillSchema = z.object({
  method: z.enum(PAYMENT_METHODS),
});

export type PayBillInput = z.infer<typeof payBillSchema>;

export function parsePayBillInput(value: unknown): PayBillInput {
  const result = payBillSchema.safeParse(value);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new BillError(400, first ? `method: ${first.message}` : "Invalid payment details.");
  }
  return result.data;
}

const billInclude = {
  orders: {
    include: {
      order: {
        include: {
          items: {
            include: { customizations: true },
            orderBy: { sortOrder: "asc" as const },
          },
        },
      },
    },
    orderBy: { order: { createdAt: "asc" as const } },
  },
  payments: { orderBy: { createdAt: "desc" as const } },
};

type BillRecord = {
  id: string;
  sessionId: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  total: number;
  taxBreakdown: unknown;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  orders: { order: Parameters<typeof mapOrder>[0] }[];
  payments: {
    id: string;
    billId: string;
    amount: number;
    method: string;
    status: string;
    provider: string;
    transactionId: string | null;
    createdAt: Date;
    completedAt: Date | null;
  }[];
};

function parseTaxBreakdown(value: unknown): { name: string; amount: number }[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const { name, amount } = entry as { name?: unknown; amount?: unknown };
    if (typeof name !== "string" || typeof amount !== "number") return [];
    return [{ name, amount }];
  });
}

function mapPayment(record: BillRecord["payments"][number]): Payment {
  return {
    id: record.id,
    billId: record.billId,
    amount: record.amount,
    method: record.method as PaymentMethod,
    status: record.status as PaymentStatus,
    provider: record.provider,
    transactionId: record.transactionId,
    createdAt: record.createdAt.toISOString(),
    completedAt: record.completedAt ? record.completedAt.toISOString() : null,
  };
}

export function mapBill(record: BillRecord): Bill {
  const items: BillItem[] = record.orders.map(({ order }) => {
    const mapped = mapOrder(order);
    return {
      orderId: mapped.id,
      items: mapped.items,
      subtotal: mapped.subtotal,
      taxAmount: mapped.taxAmount,
      serviceCharge: mapped.serviceCharge,
      total: mapped.total,
    };
  });

  // A bill can have several attempts; show the successful one when present.
  const payment =
    record.payments.find((entry) => entry.status === "succeeded") ?? record.payments[0] ?? null;

  return {
    id: record.id,
    sessionId: record.sessionId,
    items,
    subtotal: record.subtotal,
    taxes: parseTaxBreakdown(record.taxBreakdown),
    serviceCharge: record.serviceCharge,
    total: record.total,
    status: record.status as Bill["status"],
    notes: record.notes,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    payment: payment ? mapPayment(payment) : null,
  };
}

/**
 * Creates or refreshes the bill for a dining session.
 *
 * Every figure is recomputed from the persisted orders and the restaurant's tax
 * configuration inside a transaction; cancelled orders are excluded.
 */
export async function generateBill(sessionId: string): Promise<Bill> {
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const session = await tx.diningSession.findUnique({
      where: { id: sessionId },
      select: { id: true, tableId: true, status: true },
    });
    if (!session) {
      throw new BillError(404, "Dining session not found.");
    }
    if (session.status === "COMPLETED" || session.status === "CANCELLED") {
      throw new BillError(409, "This dining session is closed.");
    }

    const existing = await tx.bill.findUnique({
      where: { sessionId },
      select: { id: true, status: true },
    });
    if (existing?.status === "paid") {
      throw new BillError(409, "This bill has already been paid.");
    }

    const restaurant = await tx.restaurant.findFirst({
      include: { taxes: true },
      orderBy: { createdAt: "asc" },
    });
    if (!restaurant) {
      throw new BillError(503, "The restaurant is not configured yet.");
    }

    const orders = await tx.order.findMany({
      where: { sessionId, status: { not: "CANCELLED" } },
      select: { id: true, subtotal: true },
      orderBy: { createdAt: "asc" },
    });
    if (orders.length === 0) {
      throw new BillError(400, "There are no billable orders for this session.");
    }

    const subtotal = orders.reduce((sum, order) => sum + order.subtotal, 0);

    const taxes = restaurant.taxes.map((tax) => ({
      name: tax.name,
      amount:
        tax.type === "fixed" ? tax.rate : Math.round((subtotal * tax.rate) / 100),
    }));
    const taxAmount = taxes.reduce((sum, tax) => sum + tax.amount, 0);
    const serviceCharge = Math.round((subtotal * restaurant.serviceCharge) / 100);
    const total = subtotal + taxAmount + serviceCharge;

    const bill = existing
      ? await tx.bill.update({
          where: { id: existing.id },
          data: {
            status: "requested",
            subtotal,
            taxAmount,
            serviceCharge,
            total,
            taxBreakdown: taxes,
          },
        })
      : await tx.bill.create({
          data: {
            sessionId,
            status: "requested",
            subtotal,
            taxAmount,
            serviceCharge,
            total,
            taxBreakdown: taxes,
            notes: "",
          },
        });

    await tx.billOrder.deleteMany({ where: { billId: bill.id } });
    await tx.billOrder.createMany({
      data: orders.map((order) => ({ billId: bill.id, orderId: order.id })),
    });

    if (session.status === "ACTIVE") {
      await tx.diningSession.update({
        where: { id: sessionId },
        data: { status: "BILL_REQUESTED" },
      });
    }

    const fresh = await tx.bill.findUniqueOrThrow({
      where: { id: bill.id },
      include: billInclude,
    });

    return mapBill(fresh as BillRecord);
  });
}

export async function getBillBySession(sessionId: string): Promise<Bill | null> {
  const prisma = getPrisma();
  const bill = await prisma.bill.findUnique({
    where: { sessionId },
    include: billInclude,
  });

  return bill ? mapBill(bill as BillRecord) : null;
}

export async function getBillById(billId: string): Promise<Bill | null> {
  const prisma = getPrisma();
  const bill = await prisma.bill.findUnique({
    where: { id: billId },
    include: billInclude,
  });

  return bill ? mapBill(bill as BillRecord) : null;
}

/**
 * Records a demo payment for the bill and closes the dining session.
 *
 * The `status: { not: "paid" }` guard on the bill update makes a second
 * concurrent payment fail instead of double-charging.
 */
export async function recordPayment(
  billId: string,
  input: PayBillInput
): Promise<{ payment: Payment; bill: Bill }> {
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const bill = await tx.bill.findUnique({
      where: { id: billId },
      select: {
        id: true,
        total: true,
        status: true,
        session: { select: { id: true, tableId: true, status: true } },
      },
    });
    if (!bill) {
      throw new BillError(404, "Bill not found.");
    }
    if (bill.status === "paid") {
      throw new BillError(409, "This bill has already been paid.");
    }
    if (bill.total <= 0) {
      throw new BillError(400, "This bill has nothing to pay.");
    }

    const claimed = await tx.bill.updateMany({
      where: { id: billId, status: { not: "paid" } },
      data: { status: "paid" },
    });
    if (claimed.count === 0) {
      throw new BillError(409, "This bill has already been paid.");
    }

    const created = await tx.payment.create({
      data: {
        billId,
        amount: bill.total,
        method: input.method,
        status: "succeeded",
        provider: "demo",
        transactionId: generateTransactionId(),
        completedAt: new Date(),
      },
    });

    if (bill.session.status !== "COMPLETED") {
      await tx.diningSession.update({
        where: { id: bill.session.id },
        data: { status: "COMPLETED" },
      });
    }

    await tx.restaurantTable.update({
      where: { id: bill.session.tableId },
      data: { status: "free", sessionId: null },
    });

    const fresh = await tx.bill.findUniqueOrThrow({
      where: { id: billId },
      include: billInclude,
    });

    return { payment: mapPayment(created), bill: mapBill(fresh as BillRecord) };
  });
}

function generateTransactionId(): string {
  const suffix = Math.floor(Math.random() * 36 ** 8)
    .toString(36)
    .toUpperCase()
    .padStart(8, "0");
  return `PAY-${suffix}`;
}
