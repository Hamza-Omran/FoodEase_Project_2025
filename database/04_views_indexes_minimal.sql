USE food_ordering_platform;

-- ============================================
-- MINIMAL VIEWS (Removed functions for deleted columns/tables)
-- ============================================

-- 1. Daily sales summary
DROP VIEW IF EXISTS vw_daily_sales;
CREATE VIEW vw_daily_sales AS
SELECT 
    r.restaurant_id,
    r.name as restaurant_name,
    DATE(o.order_date) as order_date,
    COUNT(*) as total_orders,
    SUM(o.total_amount) as total_revenue,
    AVG(o.total_amount) as avg_order_value,
    SUM(CASE WHEN o.status = 'delivered' THEN 1 ELSE 0 END) as completed_orders,
    SUM(CASE WHEN o.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders
FROM Restaurants r
LEFT JOIN Orders o ON r.restaurant_id = o.restaurant_id
WHERE o.order_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY r.restaurant_id, DATE(o.order_date);

-- 2. Customer order history
DROP VIEW IF EXISTS vw_customer_orders;
CREATE VIEW vw_customer_orders AS
SELECT 
    c.customer_id,
    u.full_name as customer_name,
    u.email,
    c.total_orders,
    c.total_spent,
    c.loyalty_points,
    o.order_id,
    o.order_number,
    o.order_date,
    o.status,
    o.total_amount,
    r.name as restaurant_name
FROM Customers c
JOIN Users u ON c.user_id = u.user_id
JOIN Orders o ON c.customer_id = o.customer_id
JOIN Restaurants r ON o.restaurant_id = r.restaurant_id;

-- 3. Restaurant performance
DROP VIEW IF EXISTS vw_restaurant_performance;
CREATE VIEW vw_restaurant_performance AS
SELECT 
    r.restaurant_id,
    r.name,
    COUNT(DISTINCT o.order_id) as total_orders_30d,
    SUM(CASE WHEN o.order_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN o.total_amount ELSE 0 END) as revenue_30d,
    AVG(CASE WHEN o.order_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN o.total_amount END) as avg_order_value_30d,
    COUNT(DISTINCT o.customer_id) as unique_customers_30d
FROM Restaurants r
LEFT JOIN Orders o ON r.restaurant_id = o.restaurant_id
    AND o.order_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY r.restaurant_id;

-- 4. Driver performance (removed references to deleted columns)
DROP VIEW IF EXISTS vw_driver_performance;
CREATE VIEW vw_driver_performance AS
SELECT 
    d.driver_id,
    u.full_name,
    d.vehicle_type,
    d.total_deliveries,
    d.completed_deliveries,
    COUNT(da.assignment_id) as assignments_7d,
    ROUND((d.completed_deliveries / NULLIF(d.total_deliveries, 0)) * 100, 2) as completion_rate,
    COALESCE(SUM(CASE WHEN da.delivery_status = 'delivered' THEN da.driver_earnings ELSE 0 END), 0) as total_earnings
FROM Drivers d
JOIN Users u ON d.user_id = u.user_id
LEFT JOIN Delivery_Assignments da ON d.driver_id = da.driver_id
    AND da.assigned_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
GROUP BY d.driver_id;

-- ============================================
-- MINIMAL INDEXES (Only for existing columns)
-- ============================================

-- Order indexes
CREATE INDEX idx_orders_customer_date ON Orders(customer_id, order_date DESC);
CREATE INDEX idx_orders_restaurant_status ON Orders(restaurant_id, status, order_date DESC);

-- Order items index
CREATE INDEX idx_order_items_menu_item ON Order_Items(menu_item_id, order_id);

-- Delivery assignments index
CREATE INDEX idx_delivery_assignments_status ON Delivery_Assignments(delivery_status, assigned_at);

-- Cart items index (removed restaurant_id reference)
CREATE INDEX idx_cart_customer_added ON Cart_Items(customer_id, added_at DESC);

-- Menu items index
CREATE INDEX idx_menu_items_category_available ON Menu_Items(category_id, is_available);

-- ============================================
-- NOTES:
-- ============================================
-- Removed:
-- - fn_is_restaurant_open (references deleted opening_time/closing_time)
-- - fn_validate_coupon (references deleted Coupons table)
-- - vw_popular_menu_items (references deleted total_orders column)
-- - Indexes for deleted tables (Payments, Notifications)
-- - idx_cart_customer_restaurant (restaurant_id removed from Cart_Items)
-- ============================================
