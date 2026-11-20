# THE AURA LEAF

A digital dining experience for a contemporary Indian restaurant: scan the table
QR code, browse the menu, customise dishes, place orders, and settle the bill.

Built with Next.js (App Router), TypeScript, Tailwind CSS, and Prisma + MySQL.

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create your local environment file:

```bash
cp .env.example .env      # macOS / Linux
copy .env.example .env    # Windows PowerShell
```

3. Point `DATABASE_URL` at a MySQL database and create the database if needed:

```sql
CREATE DATABASE aura_leaf CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

4. Generate the Prisma client, create the tables, and seed the menu:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

5. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and open the menu at
`/menu?table=12`.

## Database scripts

| Script | Description |
| --- | --- |
| `npm run db:generate` | Generate the Prisma client into `src/generated/prisma` |
| `npm run db:push` | Push the schema to the database (quick local setup) |
| `npm run db:migrate` | Create a versioned migration (`prisma migrate dev`) |
| `npm run db:seed` | Seed restaurant, categories, menu, modifiers, and tables |
| `npm run db:studio` | Open Prisma Studio |

## API routes

All catalogue routes read live data from MySQL through Prisma.

| Route | Description |
| --- | --- |
| `GET /api/restaurant` | Restaurant profile, hours, and taxes |
| `GET /api/categories` | Menu categories with live item counts |
| `GET /api/menu-items` | All menu items with modifiers and options |
| `GET /api/menu-items/[slug]` | A single menu item by slug |
| `GET /api/tables` | All restaurant tables and their status |
| `GET /api/tables/[number]` | A single table by number |

### Orders

| Route | Description |
| --- | --- |
| `GET /api/orders?sessionId=…` | All orders for one dining session (`[]` if the session does not exist yet) |
| `POST /api/orders` | Validate the cart and create an order with its items and customizations |
| `GET /api/orders/[id]` | A single order with items and customizations |
| `PATCH /api/orders/[id]` | Advance an order's status |

`POST /api/orders` takes the dining session, table number, and cart lines
(`menuItemId`, `quantity`, `customizations`, `specialInstructions`). Prices,
taxes, service charge, and modifier validity are recomputed from MySQL inside a
single Prisma transaction; client-side totals are ignored. The first order for a
table creates the `DiningSession` row and marks the table `occupied`.

`PATCH /api/orders/[id]` accepts `{ "status": "…" }` and only allows
`PENDING → ACCEPTED → PREPARING → READY → SERVED` (or `CANCELLED` from any
non-terminal state). Repeating the current status is a no-op; anything else
returns `409`.

### Billing and payments

| Route | Description |
| --- | --- |
| `POST /api/bills` | Generate/refresh a session bill from persisted non-cancelled orders |
| `GET /api/bills?sessionId=…` | Retrieve the bill for a session |
| `POST /api/payments` | Record a simulated payment (`billId`, `method`) and close session/release table |

Payments are demo-only; no payment gateway is connected.

### Admin

- `/admin` — revenue totals, orders, payment counts, menu count, table status, recent orders.
- `GET /api/admin/summary` — dashboard data.

### DBMS SQL features

Run `docs/dbms-phase5.sql` in MySQL Workbench after schema setup to create views, stored procedures, a payment trigger, indexes and sample reporting queries.

## Notes

- The static files in `src/data` remain the seed source of truth for the menu.
- The menu page fetches categories and items from the API at runtime, so changes
  made in the database appear without a rebuild.
- Orders and order items are persisted; bills, payments, and the admin dashboard
  are not part of this phase.
