/**
 * THE AURA LEAF — database seed
 *
 * Populates the Phase 2 catalogue (restaurant, categories, menu items,
 * modifiers and tables) from the existing static data files so there is a
 * single source of truth during the migration.
 *
 * Run with: npm run db:seed
 */
import { getPrisma } from "../src/lib/prisma";
import { RESTAURANT } from "../src/data/restaurant";
import { CATEGORIES } from "../src/data/categories";
import { MENU_ITEMS, MODIFIERS } from "../src/data/menu";
import { TABLES } from "../src/data/tables";

async function seedRestaurant(prisma: ReturnType<typeof getPrisma>) {
  await prisma.restaurant.upsert({
    where: { id: RESTAURANT.id },
    update: {
      name: RESTAURANT.name,
      tagline: RESTAURANT.tagline,
      description: RESTAURANT.description,
      address: RESTAURANT.address,
      phone: RESTAURANT.phone,
      email: RESTAURANT.email,
      latitude: RESTAURANT.location.lat,
      longitude: RESTAURANT.location.lng,
      currencyCode: RESTAURANT.currency.code,
      currencySymbol: RESTAURANT.currency.symbol,
      currencyLocale: RESTAURANT.currency.locale,
      primaryImage: RESTAURANT.branding.primaryImage,
      logo: RESTAURANT.branding.logo,
      serviceCharge: RESTAURANT.serviceCharge,
    },
    create: {
      id: RESTAURANT.id,
      name: RESTAURANT.name,
      tagline: RESTAURANT.tagline,
      description: RESTAURANT.description,
      address: RESTAURANT.address,
      phone: RESTAURANT.phone,
      email: RESTAURANT.email,
      latitude: RESTAURANT.location.lat,
      longitude: RESTAURANT.location.lng,
      currencyCode: RESTAURANT.currency.code,
      currencySymbol: RESTAURANT.currency.symbol,
      currencyLocale: RESTAURANT.currency.locale,
      primaryImage: RESTAURANT.branding.primaryImage,
      logo: RESTAURANT.branding.logo,
      serviceCharge: RESTAURANT.serviceCharge,
    },
  });

  await prisma.restaurantHour.deleteMany({ where: { restaurantId: RESTAURANT.id } });
  await prisma.restaurantHour.createMany({
    data: Object.entries(RESTAURANT.hours).map(([label, value], index) => ({
      restaurantId: RESTAURANT.id,
      label,
      value,
      sortOrder: index,
    })),
  });

  await prisma.tax.deleteMany({ where: { restaurantId: RESTAURANT.id } });
  await prisma.tax.createMany({
    data: RESTAURANT.taxes.map((tax) => ({
      id: tax.id,
      restaurantId: RESTAURANT.id,
      name: tax.name,
      rate: tax.rate,
      type: tax.type,
    })),
  });
}

async function seedCategories(prisma: ReturnType<typeof getPrisma>) {
  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: {
        slug: category.slug,
        name: category.name,
        description: category.description,
        image: category.image,
        sortOrder: category.order,
      },
      create: {
        id: category.id,
        slug: category.slug,
        name: category.name,
        description: category.description,
        image: category.image,
        sortOrder: category.order,
      },
    });
  }
}

async function seedModifiers(prisma: ReturnType<typeof getPrisma>) {
  for (const modifier of Object.values(MODIFIERS)) {
    await prisma.modifier.upsert({
      where: { id: modifier.id },
      update: {
        name: modifier.name,
        type: modifier.type,
        required: modifier.required,
      },
      create: {
        id: modifier.id,
        name: modifier.name,
        type: modifier.type,
        required: modifier.required,
      },
    });

    await prisma.modifierOption.deleteMany({ where: { modifierId: modifier.id } });
    await prisma.modifierOption.createMany({
      data: modifier.options.map((option, index) => ({
        modifierId: modifier.id,
        id: option.id,
        name: option.name,
        price: option.price,
        sortOrder: index,
      })),
    });
  }
}

async function seedMenuItems(prisma: ReturnType<typeof getPrisma>) {
  const sortByCategory = new Map<string, number>();

  for (const item of MENU_ITEMS) {
    const sortOrder = sortByCategory.get(item.categoryId) ?? 0;
    sortByCategory.set(item.categoryId, sortOrder + 1);

    const data = {
      slug: item.slug,
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image,
      dietary: item.dietary,
      spicyLevel: item.spicyLevel,
      isFeatured: item.isFeatured,
      isPopular: item.isPopular,
      available: item.available,
      preparationTime: item.preparationTime,
      allergens: item.allergens,
      servings: item.servings,
      sortOrder,
      categoryId: item.categoryId,
    };

    await prisma.menuItem.upsert({
      where: { id: item.id },
      update: data,
      create: { id: item.id, ...data },
    });

    await prisma.menuItemModifier.deleteMany({ where: { menuItemId: item.id } });
    if (item.modifiers.length > 0) {
      await prisma.menuItemModifier.createMany({
        data: item.modifiers.map((modifier, index) => ({
          menuItemId: item.id,
          modifierId: modifier.id,
          sortOrder: index,
        })),
      });
    }
  }
}

async function seedTables(prisma: ReturnType<typeof getPrisma>) {
  for (const table of TABLES) {
    await prisma.restaurantTable.upsert({
      where: { id: table.id },
      update: {
        number: table.number,
        name: table.name,
        capacity: table.capacity,
        status: table.status,
        sessionId: table.sessionId,
      },
      create: {
        id: table.id,
        number: table.number,
        name: table.name,
        capacity: table.capacity,
        status: table.status,
        sessionId: table.sessionId,
      },
    });
  }
}

async function main() {
  const prisma = getPrisma();

  console.log("Seeding restaurant…");
  await seedRestaurant(prisma);

  console.log("Seeding categories…");
  await seedCategories(prisma);

  console.log("Seeding modifiers…");
  await seedModifiers(prisma);

  console.log("Seeding menu items…");
  await seedMenuItems(prisma);

  console.log("Seeding tables…");
  await seedTables(prisma);

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    // The generated client exposes $disconnect; safe to call even on error.
    const { getPrisma } = await import("../src/lib/prisma");
    await getPrisma().$disconnect();
  });
