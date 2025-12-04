USE food_ordering_platform;

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

DELIMITER $$

-- Check if restaurant is open
DROP FUNCTION IF EXISTS fn_is_restaurant_open$$
CREATE FUNCTION fn_is_restaurant_open(
    p_restaurant_id INT
) RETURNS BOOLEAN
DETERMINISTIC
BEGIN
    DECLARE v_current_time TIME;
    DECLARE v_opening_time TIME;
    DECLARE v_closing_time TIME;
    DECLARE v_status VARCHAR(50);
    
    SELECT 
        opening_time, 
        closing_time, 
        status
    INTO 
        v_opening_time, 
        v_closing_time, 
        v_status
    FROM Restaurants 
    WHERE restaurant_id = p_restaurant_id;
    
    SET v_current_time = CURRENT_TIME();
    
    RETURN (
        v_status = 'active' 
        AND v_opening_time IS NOT NULL 
        AND v_closing_time IS NOT NULL
        AND (
            (v_opening_time <= v_closing_time AND v_current_time BETWEEN v_opening_time AND v_closing_time)
            OR (v_opening_time > v_closing_time AND (v_current_time >= v_opening_time OR v_current_time <= v_closing_time))
        )
    );
END$$

-- Validate coupon for order
DROP FUNCTION IF EXISTS fn_validate_coupon$$
CREATE FUNCTION fn_validate_coupon(
    p_coupon_code VARCHAR(50),
    p_customer_id INT,
    p_order_amount DECIMAL(10,2),
    p_restaurant_id INT
) RETURNS JSON
DETERMINISTIC
BEGIN
    DECLARE v_coupon JSON;
    
    SELECT JSON_OBJECT(
        'valid', TRUE,
        'discount_amount', 
            CASE 
                WHEN discount_type = 'percentage' THEN 
                    LEAST(p_order_amount * (discount_value / 100), COALESCE(max_discount_amount, p_order_amount))
                ELSE discount_value
            END,
        'message', 'Coupon applied successfully'
    ) INTO v_coupon
    FROM Coupons c
    WHERE code = p_coupon_code
    AND is_active = TRUE
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date >= NOW())
    AND (usage_limit IS NULL OR usage_count < usage_limit)
    AND (applicable_to = 'all' OR 
         (applicable_to = 'restaurant' AND restaurant_id = p_restaurant_id))
    AND p_order_amount >= COALESCE(min_order_amount, 0)
    AND (per_user_limit IS NULL OR 
         (SELECT COUNT(*) FROM Coupon_Usage 
          WHERE coupon_id = c.coupon_id 
          AND customer_id = p_customer_id) < per_user_limit);
    
    RETURN COALESCE(v_coupon, JSON_OBJECT('valid', FALSE, 'message', 'Invalid or expired coupon'));
END$$

DELIMITER ;

-- ============================================
-- REPORTING VIEWS
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
    r.name as restaurant_name,
    o.rating as order_rating
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
    r.rating,
    r.total_reviews,
    COUNT(DISTINCT o.order_id) as total_orders_30d,
    SUM(CASE WHEN o.order_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN o.total_amount ELSE 0 END) as revenue_30d,
    AVG(CASE WHEN o.order_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN o.total_amount END) as avg_order_value_30d,
    COUNT(DISTINCT o.customer_id) as unique_customers_30d
FROM Restaurants r
LEFT JOIN Orders o ON r.restaurant_id = o.restaurant_id
    AND o.order_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY r.restaurant_id;

-- 4. Driver performance
DROP VIEW IF EXISTS vw_driver_performance;
CREATE VIEW vw_driver_performance AS
SELECT 
    d.driver_id,
    u.full_name,
    d.vehicle_type,
    d.rating,
    d.total_deliveries,
    d.completed_deliveries,
    d.cancelled_deliveries,
    d.earnings_total,
    COUNT(da.assignment_id) as assignments_7d,
    ROUND((d.completed_deliveries / NULLIF(d.total_deliveries, 0)) * 100, 2) as completion_rate
FROM Drivers d
JOIN Users u ON d.user_id = u.user_id
LEFT JOIN Delivery_Assignments da ON d.driver_id = da.driver_id
    AND da.assigned_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
GROUP BY d.driver_id;

-- 5. Popular menu items
DROP VIEW IF EXISTS vw_popular_menu_items;
CREATE VIEW vw_popular_menu_items AS
SELECT 
    mi.restaurant_id,
    r.name as restaurant_name,
    mi.menu_item_id,
    mi.name as item_name,
    mi.price,
    mi.rating,
    mi.total_reviews,
    mi.total_orders
FROM Menu_Items mi
JOIN Restaurants r ON mi.restaurant_id = r.restaurant_id
WHERE mi.total_orders > 0
ORDER BY mi.total_orders DESC;

-- ============================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_orders_customer_date ON Orders(customer_id, order_date DESC);
CREATE INDEX idx_orders_restaurant_status ON Orders(restaurant_id, status, order_date DESC);
CREATE INDEX idx_order_items_menu_item ON Order_Items(menu_item_id, order_id);
CREATE INDEX idx_delivery_assignments_status ON Delivery_Assignments(delivery_status, assigned_at);
CREATE INDEX idx_payments_order_status ON Payments(order_id, payment_status);
CREATE INDEX idx_reviews_restaurant_date ON Reviews(restaurant_id, created_at DESC);
CREATE INDEX idx_cart_customer_restaurant ON Cart_Items(customer_id, restaurant_id, added_at DESC);
CREATE INDEX idx_menu_items_category_available ON Menu_Items(category_id, is_available);
CREATE INDEX idx_notifications_user_unread ON Notifications(user_id, is_read, created_at DESC);