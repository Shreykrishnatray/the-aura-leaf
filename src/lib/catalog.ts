import { getPrisma } from "./prisma";
import type {
  Dietary,
  MenuCategory,
  MenuItem,
  MenuItemModifier,
  Restaurant,
  Table,
  TableStatus,
} from "@/types";

/**
 * Server-side catalogue access. Every function reads live data from MySQL via
 * Prisma and maps it to the shapes the existing frontend already expects, so
 * components do not need to change their contracts.
 */

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function mapModifier(record: {
  id: string;
  name: string;
  type: string;
  required: boolean;
  options: { id: string; name: string; price: number }[];
}): MenuItemModifier {
  return {
    id: record.id,
    name: record.name,
    type: record.type === "multiple" ? "multiple" : "single",
    required: record.required,
    options: record.options.map((option) => ({
      id: option.id,
      name: option.name,
      price: option.price,
    })),
  };
}

interface MenuItemRecord {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  image: string;
  dietary: string;
  spicyLevel: number;
  isFeatured: boolean;
  isPopular: boolean;
  available: boolean;
  preparationTime: number;
  allergens: unknown;
  servings: number;
  categoryId: string;
  modifiers: {
    sortOrder: number;
    modifier: {
      id: string;
      name: string;
      type: string;
      required: boolean;
      options: { id: string; name: string; price: number; sortOrder: number }[];
    };
  }[];
}

function mapMenuItem(record: MenuItemRecord): MenuItem {
  const spicyLevel = Math.min(3, Math.max(0, record.spicyLevel)) as 0 | 1 | 2 | 3;

  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    description: record.description,
    price: record.price,
    image: record.image,
    dietary: record.dietary as Dietary,
    spicyLevel,
    isFeatured: record.isFeatured,
    isPopular: record.isPopular,
    available: record.available,
    preparationTime: record.preparationTime,
    allergens: toStringArray(record.allergens),
    servings: record.servings,
    modifiers: [...record.modifiers]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((join) => mapModifier(join.modifier)),
    categoryId: record.categoryId,
  };
}

const menuItemInclude = {
  modifiers: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      modifier: {
        include: {
          options: { orderBy: { sortOrder: "asc" as const } },
        },
      },
    },
  },
};

export async function getMenuItems(): Promise<MenuItem[]> {
  const prisma = getPrisma();
  const items = await prisma.menuItem.findMany({
    include: menuItemInclude,
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });

  return items.map((item) => mapMenuItem(item as unknown as MenuItemRecord));
}

export async function getMenuItemBySlug(slug: string): Promise<MenuItem | null> {
  const prisma = getPrisma();
  const item = await prisma.menuItem.findUnique({
    where: { slug },
    include: menuItemInclude,
  });

  return item ? mapMenuItem(item as unknown as MenuItemRecord) : null;
}

export async function getCategories(): Promise<MenuCategory[]> {
  const prisma = getPrisma();
  const categories = await prisma.category.findMany({
    include: { _count: { select: { items: true } } },
    orderBy: { sortOrder: "asc" },
  });

  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description,
    image: category.image,
    order: category.sortOrder,
    itemCount: category._count.items,
  }));
}

export async function getRestaurant(): Promise<Restaurant | null> {
  const prisma = getPrisma();
  const record = await prisma.restaurant.findFirst({
    include: {
      hours: { orderBy: { sortOrder: "asc" } },
      taxes: true,
    },
  });

  if (!record) return null;

  return {
    id: record.id,
    name: record.name,
    tagline: record.tagline,
    description: record.description,
    address: record.address,
    phone: record.phone,
    email: record.email,
    hours: Object.fromEntries(record.hours.map((hour) => [hour.label, hour.value])),
    location: { lat: record.latitude, lng: record.longitude },
    currency: {
      code: record.currencyCode,
      symbol: record.currencySymbol,
      locale: record.currencyLocale,
    },
    branding: { primaryImage: record.primaryImage, logo: record.logo },
    taxes: record.taxes.map((tax) => ({
      id: tax.id,
      name: tax.name,
      rate: tax.rate,
      type: tax.type === "fixed" ? "fixed" : "percentage",
    })),
    serviceCharge: record.serviceCharge,
  };
}

export async function getTables(): Promise<Table[]> {
  const prisma = getPrisma();
  const tables = await prisma.restaurantTable.findMany({
    orderBy: { number: "asc" },
  });

  return tables.map((table) => ({
    id: table.id,
    number: table.number,
    name: table.name,
    capacity: table.capacity,
    status: table.status as TableStatus,
    sessionId: table.sessionId,
  }));
}

export async function getTableByNumber(number: string): Promise<Table | null> {
  const prisma = getPrisma();
  const table = await prisma.restaurantTable.findUnique({ where: { number } });

  if (!table) return null;

  return {
    id: table.id,
    number: table.number,
    name: table.name,
    capacity: table.capacity,
    status: table.status as TableStatus,
    sessionId: table.sessionId,
  };
}
