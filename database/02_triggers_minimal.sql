USE food_ordering_platform;

-- ============================================
-- MINIMAL TRIGGERS
-- Works without order_sequence table
-- ============================================

DELIMITER $$

-- 1. Order number generation removed from trigger
-- Now handled directly in sp_place_order stored procedure
-- to avoid "Can't update table in trigger" error


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
        + COALESCE((SELECT tax FROM Orders WHERE order_id = NEW.order_id), 0);
    
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
        + COALESCE((SELECT tax FROM Orders WHERE order_id = NEW.order_id), 0);
    
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
        + COALESCE((SELECT tax FROM Orders WHERE order_id = OLD.order_id), 0);
    
    UPDATE Orders 
    SET subtotal = COALESCE(v_subtotal, 0),
        total_amount = v_total
    WHERE order_id = OLD.order_id;
END$$

-- 3. Update customer statistics after delivery
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

-- 4. Update driver statistics
DROP TRIGGER IF EXISTS trg_update_driver_stats$$
CREATE TRIGGER trg_update_driver_stats
AFTER UPDATE ON Delivery_Assignments
FOR EACH ROW
BEGIN
    IF NEW.delivery_status = 'delivered' AND OLD.delivery_status != 'delivered' THEN
        UPDATE Drivers
        SET completed_deliveries = completed_deliveries + 1,
            total_deliveries = total_deliveries + 1
        WHERE driver_id = NEW.driver_id;
    END IF;
    
    IF NEW.delivery_status = 'failed' AND OLD.delivery_status != 'failed' THEN
        UPDATE Drivers
        SET total_deliveries = total_deliveries + 1
        WHERE driver_id = NEW.driver_id;
    END IF;
END$$

-- 5. Auto-create customer record when user registers
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

-- ============================================
-- REVIEW RATING TRIGGERS
-- Automatically update average ratings and counts
-- ============================================

-- Restaurant review triggers

-- Update restaurant rating after new review
DROP TRIGGER IF EXISTS trg_update_restaurant_rating_after_insert$$
CREATE TRIGGER trg_update_restaurant_rating_after_insert
AFTER INSERT ON Restaurant_Reviews
FOR EACH ROW
BEGIN
    DECLARE avg_rating DECIMAL(3,2);
    DECLARE total_reviews INT;
    
    SELECT AVG(rating), COUNT(*) 
    INTO avg_rating, total_reviews
    FROM Restaurant_Reviews 
    WHERE restaurant_id = NEW.restaurant_id;
    
    UPDATE Restaurants 
    SET rating = avg_rating,
        review_count = total_reviews
    WHERE restaurant_id = NEW.restaurant_id;
END$$

-- Update restaurant rating after review update
DROP TRIGGER IF EXISTS trg_update_restaurant_rating_after_update$$
CREATE TRIGGER trg_update_restaurant_rating_after_update
AFTER UPDATE ON Restaurant_Reviews
FOR EACH ROW
BEGIN
    DECLARE avg_rating DECIMAL(3,2);
    DECLARE total_reviews INT;
    
    SELECT AVG(rating), COUNT(*) 
    INTO avg_rating, total_reviews
    FROM Restaurant_Reviews 
    WHERE restaurant_id = NEW.restaurant_id;
    
    UPDATE Restaurants 
    SET rating = avg_rating,
        review_count = total_reviews
    WHERE restaurant_id = NEW.restaurant_id;
END$$

-- Update restaurant rating after review deletion
DROP TRIGGER IF EXISTS trg_update_restaurant_rating_after_delete$$
CREATE TRIGGER trg_update_restaurant_rating_after_delete
AFTER DELETE ON Restaurant_Reviews
FOR EACH ROW
BEGIN
    DECLARE avg_rating DECIMAL(3,2);
    DECLARE total_reviews INT;
    
    SELECT COALESCE(AVG(rating), 0), COUNT(*) 
    INTO avg_rating, total_reviews
    FROM Restaurant_Reviews 
    WHERE restaurant_id = OLD.restaurant_id;
    
    UPDATE Restaurants 
    SET rating = avg_rating,
        review_count = total_reviews
    WHERE restaurant_id = OLD.restaurant_id;
END$$

-- Menu item review triggers

-- Update menu item rating after new review
DROP TRIGGER IF EXISTS trg_update_menu_item_rating_after_insert$$
CREATE TRIGGER trg_update_menu_item_rating_after_insert
AFTER INSERT ON Menu_Item_Reviews
FOR EACH ROW
BEGIN
    DECLARE avg_rating DECIMAL(3,2);
    DECLARE total_reviews INT;
    
    SELECT AVG(rating), COUNT(*) 
    INTO avg_rating, total_reviews
    FROM Menu_Item_Reviews 
    WHERE menu_item_id = NEW.menu_item_id;
    
    UPDATE Menu_Items 
    SET rating = avg_rating,
        review_count = total_reviews
    WHERE menu_item_id = NEW.menu_item_id;
END$$

-- Update menu item rating after review update
DROP TRIGGER IF EXISTS trg_update_menu_item_rating_after_update$$
CREATE TRIGGER trg_update_menu_item_rating_after_update
AFTER UPDATE ON Menu_Item_Reviews
FOR EACH ROW
BEGIN
    DECLARE avg_rating DECIMAL(3,2);
    DECLARE total_reviews INT;
    
    SELECT AVG(rating), COUNT(*) 
    INTO avg_rating, total_reviews
    FROM Menu_Item_Reviews 
    WHERE menu_item_id = NEW.menu_item_id;
    
    UPDATE Menu_Items 
    SET rating = avg_rating,
        review_count = total_reviews
    WHERE menu_item_id = NEW.menu_item_id;
END$$

-- Update menu item rating after review deletion
DROP TRIGGER IF EXISTS trg_update_menu_item_rating_after_delete$$
CREATE TRIGGER trg_update_menu_item_rating_after_delete
AFTER DELETE ON Menu_Item_Reviews
FOR EACH ROW
BEGIN
    DECLARE avg_rating DECIMAL(3,2);
    DECLARE total_reviews INT;
    
    SELECT COALESCE(AVG(rating), 0), COUNT(*) 
    INTO avg_rating, total_reviews
    FROM Menu_Item_Reviews 
    WHERE menu_item_id = OLD.menu_item_id;
    
    UPDATE Menu_Items 
    SET rating = avg_rating,
        review_count = total_reviews
    WHERE menu_item_id = OLD.menu_item_id;
END$$

DELIMITER ;
