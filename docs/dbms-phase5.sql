-- Aura Leaf Phase 5: DBMS objects (run after prisma db push + seed)
CREATE OR REPLACE VIEW vw_order_summary AS
SELECT o.id order_id,o.status,o.createdAt,t.number table_number,o.subtotal,o.taxAmount,o.serviceCharge,o.total
FROM `Order` o JOIN DiningSession s ON s.id=o.sessionId JOIN RestaurantTable t ON t.id=s.tableId;
CREATE OR REPLACE VIEW vw_paid_bills AS
SELECT b.id bill_id,b.sessionId,b.subtotal,b.taxAmount,b.serviceCharge,b.total,p.method,p.transactionId,p.completedAt
FROM Bill b JOIN Payment p ON p.billId=b.id WHERE b.status='paid' AND p.status='succeeded';
DELIMITER //
CREATE PROCEDURE sp_orders_by_status(IN p_status VARCHAR(20))
BEGIN SELECT id,status,total,createdAt FROM `Order` WHERE status=p_status ORDER BY createdAt DESC; END //
CREATE PROCEDURE sp_daily_revenue(IN p_day DATE)
BEGIN SELECT COALESCE(SUM(amount),0) revenue,COUNT(*) payment_count FROM Payment WHERE status='succeeded' AND DATE(completedAt)=p_day; END //
CREATE TRIGGER trg_payment_success_closes_session AFTER INSERT ON Payment FOR EACH ROW
BEGIN IF NEW.status='succeeded' THEN UPDATE Bill SET status='paid' WHERE id=NEW.billId; UPDATE DiningSession s JOIN Bill b ON b.sessionId=s.id SET s.status='COMPLETED' WHERE b.id=NEW.billId; UPDATE RestaurantTable t JOIN DiningSession s ON s.tableId=t.id JOIN Bill b ON b.sessionId=s.id SET t.status='free',t.sessionId=NULL WHERE b.id=NEW.billId; END IF; END //
DELIMITER ;
CREATE INDEX idx_order_created_status ON `Order`(createdAt,status);
CREATE INDEX idx_payment_completed_status ON Payment(completedAt,status);
CREATE INDEX idx_menu_available_category ON MenuItem(categoryId,available);
SELECT status,COUNT(*) orders,SUM(total) order_value FROM `Order` GROUP BY status;
SELECT method,COUNT(*) payment_count,SUM(amount) revenue FROM Payment WHERE status='succeeded' GROUP BY method;
SELECT c.name category,COUNT(oi.id) sold_units,SUM(oi.total) sales FROM OrderItem oi JOIN MenuItem mi ON mi.id=oi.menuItemId JOIN Category c ON c.id=mi.categoryId GROUP BY c.id,c.name ORDER BY sales DESC;