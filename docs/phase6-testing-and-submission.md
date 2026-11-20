# Phase 6 — Testing & Submission Checklist
## Setup
- [ ] Copy .env.example to .env and set DATABASE_URL. Never commit .env.
- [ ] npm install; npm run db:generate; npm run db:push; npm run db:seed.
- [ ] npm run lint and npm run build.
- [ ] Test menu, details, cart, checkout, orders, bill, payment, success and /admin.
## Database verification
- [ ] Verify seeded Category, MenuItem, Modifier, ModifierOption and RestaurantTable rows.
- [ ] Place an order and inspect Order, OrderItem and OrderItemCustomization.
- [ ] Generate bill and inspect Bill and BillOrder.
- [ ] Pay demo bill and verify Payment, COMPLETED session and FREE table.
- [ ] Execute docs/dbms-phase5.sql and verify views, procedures, trigger, indexes and report queries.
## Suggested screenshots
1. Menu with categories/items; 2. cart/customizations; 3. persisted order; 4. bill summary; 5. demo payment/success; 6. admin dashboard; 7. MySQL rows; 8. SQL view/procedure results.
## Scope
Payments are simulated. Admin and order-status endpoints have no authentication and are demonstration-only; secure them before production.