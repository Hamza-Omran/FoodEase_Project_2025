USE food_ordering_platform;

-- ============================================
-- TRIGGERS (Execute separately from procedures)
-- ============================================

DELIMITER $$

-- 1. Auto-generate order number
DROP TRIGGER IF EXISTS trg_generate_order_number$$
CREATE TRIGGER trg_generate_order_number
BEFORE INSERT ON Orders
FOR EACH ROW
BEGIN
    INSERT INTO order_sequence VALUES (NULL);
    SET NEW.order_number = CONCAT(
        'ORD',
        DATE_FORMAT(NEW.order_date, '%Y%m%d'),
        LPAD(LAST_INSERT_ID(), 6, '0')
    );
END$$

-- 2. Update order totals when items are added
DROP TRIGGER IF EXISTS trg_update_order_totals_insert$$
CREATE TRIGGER trg_update_order_totals_insert
AFTER INSERT ON Order_Items
FOR EACH ROW
BEGIN
    DECLARE v_subtotal DECIMAL(10,2);
    DECLARE v_total DECIMAL(10,2);
    
    SELECT SUM(subtotal) INTO v_subtotal 
    FROM Order_Items 
    WHERE order_id = NEW.order_id;
    
    SET v_total = COALESCE(v_subtotal, 0) 
        + COALESCE((SELECT delivery_fee FROM Orders WHERE order_id = NEW.order_id), 0)
        + COALESCE((SELECT tax FROM Orders WHERE order_id = NEW.order_id), 0)
        - COALESCE((SELECT discount FROM Orders WHERE order_id = NEW.order_id), 0);
    
    UPDATE Orders 
    SET subtotal = COALESCE(v_subtotal, 0),
        total_amount = v_total
    WHERE order_id = NEW.order_id;
END$$

DROP TRIGGER IF EXISTS trg_update_order_totals_update$$
CREATE TRIGGER trg_update_order_totals_update
AFTER UPDATE ON Order_Items
FOR EACH ROW
BEGIN
    DECLARE v_subtotal DECIMAL(10,2);
    DECLARE v_total DECIMAL(10,2);
    
    SELECT SUM(subtotal) INTO v_subtotal 
    FROM Order_Items 
    WHERE order_id = NEW.order_id;
    
    SET v_total = COALESCE(v_subtotal, 0) 
        + COALESCE((SELECT delivery_fee FROM Orders WHERE order_id = NEW.order_id), 0)
        + COALESCE((SELECT tax FROM Orders WHERE order_id = NEW.order_id), 0)
        - COALESCE((SELECT discount FROM Orders WHERE order_id = NEW.order_id), 0);
    
    UPDATE Orders 
    SET subtotal = COALESCE(v_subtotal, 0),
        total_amount = v_total
    WHERE order_id = NEW.order_id;
END$$

DROP TRIGGER IF EXISTS trg_update_order_totals_delete$$
CREATE TRIGGER trg_update_order_totals_delete
AFTER DELETE ON Order_Items
FOR EACH ROW
BEGIN
    DECLARE v_subtotal DECIMAL(10,2);
    DECLARE v_total DECIMAL(10,2);
    
    SELECT SUM(subtotal) INTO v_subtotal 
    FROM Order_Items 
    WHERE order_id = OLD.order_id;
    
    SET v_total = COALESCE(v_subtotal, 0) 
        + COALESCE((SELECT delivery_fee FROM Orders WHERE order_id = OLD.order_id), 0)
        + COALESCE((SELECT tax FROM Orders WHERE order_id = OLD.order_id), 0)
        - COALESCE((SELECT discount FROM Orders WHERE order_id = OLD.order_id), 0);
    
    UPDATE Orders 
    SET subtotal = COALESCE(v_subtotal, 0),
        total_amount = v_total
    WHERE order_id = OLD.order_id;
END$$

-- 3. Auto-update timestamps for order status changes
DROP TRIGGER IF EXISTS trg_update_order_timestamps$$
CREATE TRIGGER trg_update_order_timestamps
BEFORE UPDATE ON Orders
FOR EACH ROW
BEGIN
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
        SET NEW.confirmed_at = CURRENT_TIMESTAMP;
    ELSEIF NEW.status = 'preparing' AND OLD.status != 'preparing' THEN
        SET NEW.preparing_at = CURRENT_TIMESTAMP;
    ELSEIF NEW.status = 'ready' AND OLD.status != 'ready' THEN
        SET NEW.ready_at = CURRENT_TIMESTAMP;
    ELSEIF NEW.status = 'out_for_delivery' AND OLD.status != 'out_for_delivery' THEN
        SET NEW.out_for_delivery_at = CURRENT_TIMESTAMP;
    ELSEIF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
        SET NEW.delivered_at = CURRENT_TIMESTAMP;
        SET NEW.actual_delivery_time = CURRENT_TIMESTAMP;
    ELSEIF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        SET NEW.cancelled_at = CURRENT_TIMESTAMP;
    END IF;
END$$

-- 4. Log order status changes
DROP TRIGGER IF EXISTS trg_log_order_status_change$$
CREATE TRIGGER trg_log_order_status_change
AFTER UPDATE ON Orders
FOR EACH ROW
BEGIN
    IF NEW.status != OLD.status THEN
        INSERT INTO Order_Status_History (
            order_id, 
            old_status, 
            new_status, 
            changed_by
        ) VALUES (
            NEW.order_id,
            OLD.status,
            NEW.status,
            NEW.cancelled_by
        );
    END IF;
END$$

-- 5. Update restaurant rating when review is added
DROP TRIGGER IF EXISTS trg_update_restaurant_rating_insert$$
CREATE TRIGGER trg_update_restaurant_rating_insert
AFTER INSERT ON Reviews
FOR EACH ROW
BEGIN
    UPDATE Restaurants r
    SET r.rating = (
        SELECT AVG(rating) 
        FROM Reviews 
        WHERE restaurant_id = NEW.restaurant_id 
        AND is_visible = TRUE
    ),
    r.total_reviews = (
        SELECT COUNT(*) 
        FROM Reviews 
        WHERE restaurant_id = NEW.restaurant_id 
        AND is_visible = TRUE
    )
    WHERE r.restaurant_id = NEW.restaurant_id;
END$$

DROP TRIGGER IF EXISTS trg_update_restaurant_rating_update$$
CREATE TRIGGER trg_update_restaurant_rating_update
AFTER UPDATE ON Reviews
FOR EACH ROW
BEGIN
    UPDATE Restaurants r
    SET r.rating = (
        SELECT AVG(rating) 
        FROM Reviews 
        WHERE restaurant_id = NEW.restaurant_id 
        AND is_visible = TRUE
    ),
    r.total_reviews = (
        SELECT COUNT(*) 
        FROM Reviews 
        WHERE restaurant_id = NEW.restaurant_id 
        AND is_visible = TRUE
    )
    WHERE r.restaurant_id = NEW.restaurant_id;
END$$

-- 6. Update menu item rating when reviewed
DROP TRIGGER IF EXISTS trg_update_menu_item_rating$$
CREATE TRIGGER trg_update_menu_item_rating
AFTER INSERT ON Menu_Item_Reviews
FOR EACH ROW
BEGIN
    UPDATE Menu_Items mi
    SET mi.rating = (
        SELECT AVG(rating) 
        FROM Menu_Item_Reviews 
        WHERE menu_item_id = NEW.menu_item_id 
        AND is_visible = TRUE
    ),
    mi.total_reviews = (
        SELECT COUNT(*) 
        FROM Menu_Item_Reviews 
        WHERE menu_item_id = NEW.menu_item_id 
        AND is_visible = TRUE
    )
    WHERE mi.menu_item_id = NEW.menu_item_id;
END$$

-- 7. Update menu item popularity
DROP TRIGGER IF EXISTS trg_update_menu_item_popularity$$
CREATE TRIGGER trg_update_menu_item_popularity
AFTER INSERT ON Order_Items
FOR EACH ROW
BEGIN
    UPDATE Menu_Items
    SET total_orders = total_orders + NEW.quantity
    WHERE menu_item_id = NEW.menu_item_id;
END$$

-- 8. Decrement inventory when order is confirmed
DROP TRIGGER IF EXISTS trg_decrement_inventory$$
CREATE TRIGGER trg_decrement_inventory
AFTER UPDATE ON Orders
FOR EACH ROW
BEGIN
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
        UPDATE Menu_Item_Inventory mii
        JOIN Order_Items oi ON mii.menu_item_id = oi.menu_item_id
        SET mii.stock_quantity = mii.stock_quantity - oi.quantity
        WHERE oi.order_id = NEW.order_id AND mii.stock_quantity >= oi.quantity;
    END IF;
END$$

-- 9. Update customer statistics after delivery
DROP TRIGGER IF EXISTS trg_update_customer_stats$$
CREATE TRIGGER trg_update_customer_stats
AFTER UPDATE ON Orders
FOR EACH ROW
BEGIN
    IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
        UPDATE Customers
        SET total_orders = total_orders + 1,
            total_spent = total_spent + NEW.total_amount,
            loyalty_points = loyalty_points + FLOOR(NEW.total_amount / 10)
        WHERE customer_id = NEW.customer_id;
    END IF;
END$$

-- 10. Update driver statistics
DROP TRIGGER IF EXISTS trg_update_driver_stats$$
CREATE TRIGGER trg_update_driver_stats
AFTER UPDATE ON Delivery_Assignments
FOR EACH ROW
BEGIN
    IF NEW.delivery_status = 'delivered' AND OLD.delivery_status != 'delivered' THEN
        UPDATE Drivers
        SET completed_deliveries = completed_deliveries + 1,
            total_deliveries = total_deliveries + 1,
            earnings_total = earnings_total + COALESCE(NEW.driver_earnings, 0)
        WHERE driver_id = NEW.driver_id;
    END IF;
    
    IF NEW.delivery_status = 'failed' AND OLD.delivery_status != 'failed' THEN
        UPDATE Drivers
        SET cancelled_deliveries = cancelled_deliveries + 1,
            total_deliveries = total_deliveries + 1
        WHERE driver_id = NEW.driver_id;
    END IF;
END$$

-- 11. REMOVE the triggers that cause errors - we'll handle default addresses in application code
DROP TRIGGER IF EXISTS trg_one_default_address_insert$$
DROP TRIGGER IF EXISTS trg_one_default_address_update$$

-- NOTE:
--   Customer_Addresses default logic is enforced ONLY in backend JS:
--   - customer.repo.js (addAddress / updateAddress)
--   - address.controller.js
--   Do NOT recreate MySQL triggers for default address here, or you will get conflicts.

-- 12. Clear cart after successful order
DROP TRIGGER IF EXISTS trg_clear_cart_after_order$$
CREATE TRIGGER trg_clear_cart_after_order
AFTER INSERT ON Orders
FOR EACH ROW
BEGIN
    -- This deletes all cart rows for that customer & restaurant
    DELETE FROM Cart_Items 
    WHERE customer_id = NEW.customer_id 
      AND restaurant_id = NEW.restaurant_id;
END$$

-- 13. Auto-create customer record when user registers
DROP TRIGGER IF EXISTS trg_create_customer_profile$$
CREATE TRIGGER trg_create_customer_profile
AFTER INSERT ON Users
FOR EACH ROW
BEGIN
    IF NEW.role = 'customer' THEN
        INSERT INTO Customers (user_id, loyalty_points, total_orders, total_spent) 
        VALUES (NEW.user_id, 0, 0, 0.00);
    END IF;
END$$

-- 14. Update coupon usage count
DROP TRIGGER IF EXISTS trg_update_coupon_usage$$
CREATE TRIGGER trg_update_coupon_usage
AFTER INSERT ON Coupon_Usage
FOR EACH ROW
BEGIN
    UPDATE Coupons
    SET usage_count = usage_count + 1
    WHERE coupon_id = NEW.coupon_id;
END$$

DELIMITER ;