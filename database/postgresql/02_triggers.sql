-- ============================================
-- FOODEASE PLATFORM - PostgreSQL Triggers
-- Converted from MySQL triggers to PostgreSQL
-- ============================================

-- ============================================
-- 1. ORDER TOTALS UPDATE TRIGGERS
-- Update order totals when items are added/updated/deleted
-- ============================================

-- Function for updating order totals
CREATE OR REPLACE FUNCTION update_order_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_subtotal DECIMAL(10,2);
    v_total DECIMAL(10,2);
    v_order_id INTEGER;
BEGIN
    -- Determine which order_id to use
    IF (TG_OP = 'DELETE') THEN
        v_order_id := OLD.order_id;
    ELSE
        v_order_id := NEW.order_id;
    END IF;
    
    -- Calculate subtotal from order items
    SELECT COALESCE(SUM(subtotal), 0) INTO v_subtotal
    FROM Order_Items
    WHERE order_id = v_order_id;
    
    -- Calculate total including delivery fee and tax
    SELECT v_subtotal + COALESCE(delivery_fee, 0) + COALESCE(tax, 0)
    INTO v_total
    FROM Orders
    WHERE order_id = v_order_id;
    
    -- Update the order
    UPDATE Orders
    SET subtotal = v_subtotal,
        total_amount = v_total
    WHERE order_id = v_order_id;
    
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Triggers for INSERT, UPDATE, DELETE on Order_Items
CREATE TRIGGER trg_update_order_totals_insert
AFTER INSERT ON Order_Items
FOR EACH ROW
EXECUTE FUNCTION update_order_totals();

CREATE TRIGGER trg_update_order_totals_update
AFTER UPDATE ON Order_Items
FOR EACH ROW
EXECUTE FUNCTION update_order_totals();

CREATE TRIGGER trg_update_order_totals_delete
AFTER DELETE ON Order_Items
FOR EACH ROW
EXECUTE FUNCTION update_order_totals();

-- ============================================
-- 2. CUSTOMER STATISTICS UPDATE
-- Update customer stats when order is delivered
-- ============================================

CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
        UPDATE Customers
        SET total_orders = total_orders + 1,
            total_spent = total_spent + NEW.total_amount,
            loyalty_points = loyalty_points + FLOOR(NEW.total_amount / 10)
        WHERE customer_id = NEW.customer_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_customer_stats
AFTER UPDATE ON Orders
FOR EACH ROW
EXECUTE FUNCTION update_customer_stats();

-- ============================================
-- 3. DRIVER STATISTICS UPDATE
-- Update driver stats when delivery is completed/failed
-- ============================================

CREATE OR REPLACE FUNCTION update_driver_stats()
RETURNS TRIGGER AS $$
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
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_driver_stats
AFTER UPDATE ON Delivery_Assignments
FOR EACH ROW
EXECUTE FUNCTION update_driver_stats();

-- ============================================
-- 4. AUTO-CREATE CUSTOMER PROFILE
-- Automatically create customer record when user registers
-- ============================================

CREATE OR REPLACE FUNCTION create_customer_profile()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'customer' THEN
        INSERT INTO Customers (user_id, loyalty_points, total_orders, total_spent)
        VALUES (NEW.user_id, 0, 0, 0.00);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_customer_profile
AFTER INSERT ON Users
FOR EACH ROW
EXECUTE FUNCTION create_customer_profile();

-- ============================================
-- 5. RESTAURANT RATING TRIGGERS
-- Automatically update average ratings and review counts
-- ============================================

-- Function to update restaurant rating
CREATE OR REPLACE FUNCTION update_restaurant_rating()
RETURNS TRIGGER AS $$
DECLARE
    v_avg_rating DECIMAL(3,2);
    v_total_reviews INTEGER;
    v_restaurant_id INTEGER;
BEGIN
    -- Determine which restaurant_id to use
    IF (TG_OP = 'DELETE') THEN
        v_restaurant_id := OLD.restaurant_id;
    ELSE
        v_restaurant_id := NEW.restaurant_id;
    END IF;
    
    -- Calculate average rating and count
    SELECT COALESCE(AVG(rating), 0), COUNT(*)
    INTO v_avg_rating, v_total_reviews
    FROM Restaurant_Reviews
    WHERE restaurant_id = v_restaurant_id;
    
    -- Update restaurant
    UPDATE Restaurants
    SET rating = v_avg_rating,
        review_count = v_total_reviews
    WHERE restaurant_id = v_restaurant_id;
    
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Triggers for restaurant reviews
CREATE TRIGGER trg_update_restaurant_rating_insert
AFTER INSERT ON Restaurant_Reviews
FOR EACH ROW
EXECUTE FUNCTION update_restaurant_rating();

CREATE TRIGGER trg_update_restaurant_rating_update
AFTER UPDATE ON Restaurant_Reviews
FOR EACH ROW
EXECUTE FUNCTION update_restaurant_rating();

CREATE TRIGGER trg_update_restaurant_rating_delete
AFTER DELETE ON Restaurant_Reviews
FOR EACH ROW
EXECUTE FUNCTION update_restaurant_rating();

-- ============================================
-- 6. MENU ITEM RATING TRIGGERS
-- Automatically update menu item ratings and review counts
-- ============================================

-- Function to update menu item rating
CREATE OR REPLACE FUNCTION update_menu_item_rating()
RETURNS TRIGGER AS $$
DECLARE
    v_avg_rating DECIMAL(3,2);
    v_total_reviews INTEGER;
    v_menu_item_id INTEGER;
BEGIN
    -- Determine which menu_item_id to use
    IF (TG_OP = 'DELETE') THEN
        v_menu_item_id := OLD.menu_item_id;
    ELSE
        v_menu_item_id := NEW.menu_item_id;
    END IF;
    
    -- Calculate average rating and count
    SELECT COALESCE(AVG(rating), 0), COUNT(*)
    INTO v_avg_rating, v_total_reviews
    FROM Menu_Item_Reviews
    WHERE menu_item_id = v_menu_item_id;
    
    -- Update menu item
    UPDATE Menu_Items
    SET rating = v_avg_rating,
        review_count = v_total_reviews
    WHERE menu_item_id = v_menu_item_id;
    
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Triggers for menu item reviews
CREATE TRIGGER trg_update_menu_item_rating_insert
AFTER INSERT ON Menu_Item_Reviews
FOR EACH ROW
EXECUTE FUNCTION update_menu_item_rating();

CREATE TRIGGER trg_update_menu_item_rating_update
AFTER UPDATE ON Menu_Item_Reviews
FOR EACH ROW
EXECUTE FUNCTION update_menu_item_rating();

CREATE TRIGGER trg_update_menu_item_rating_delete
AFTER DELETE ON Menu_Item_Reviews
FOR EACH ROW
EXECUTE FUNCTION update_menu_item_rating();

-- ============================================
-- NOTES
-- ============================================
-- PostgreSQL triggers require:
-- 1. Create function first with RETURNS TRIGGER
-- 2. Use $$ for function body (dollar quoting)
-- 3. LANGUAGE plpgsql
-- 4. TG_OP variable to detect operation type
-- 5. Must RETURN NEW or OLD
-- 6. Use EXECUTE FUNCTION instead of FOR EACH ROW BEGIN...END
-- ============================================
