USE food_ordering_platform;

DELIMITER $$

-- ============================================
-- STREAMLINED STORED PROCEDURES
-- Only uses columns that exist in streamlined schema
-- ============================================

-- 1. Place order from cart (streamlined)
DROP PROCEDURE IF EXISTS sp_place_order$$
CREATE PROCEDURE sp_place_order(
    IN p_customer_id INT,
    IN p_restaurant_id INT,
    IN p_address_id INT,
    IN p_special_instructions TEXT,
    IN p_payment_method VARCHAR(20),
    IN p_coupon_code VARCHAR(50)
)
BEGIN
    DECLARE v_order_id INT;
    DECLARE v_subtotal DECIMAL(10,2);
    DECLARE v_delivery_fee DECIMAL(10,2);
    DECLARE v_tax DECIMAL(10,2);
    DECLARE v_total_amount DECIMAL(10,2);
    DECLARE v_cart_count INT;
    DECLARE v_error_msg VARCHAR(500);
    DECLARE v_items_inserted INT;
    DECLARE v_tmp_count INT;

    START TRANSACTION;

    -- Validate payment method
    IF p_payment_method NOT IN ('cash', 'credit_card', 'debit_card', 'mobile_wallet', 'online') THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid payment method';
    END IF;

    -- Check cart items exist for this restaurant (via JOIN since Cart_Items doesn't have restaurant_id)
    SELECT COUNT(*) INTO v_cart_count
    FROM Cart_Items ci
    JOIN Menu_Items mi ON ci.menu_item_id = mi.menu_item_id
    WHERE ci.customer_id = p_customer_id AND mi.restaurant_id = p_restaurant_id;

    IF v_cart_count = 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cart is empty for this restaurant';
    END IF;

    -- Snapshot valid cart items into TEMP table
    DROP TEMPORARY TABLE IF EXISTS tmp_cart_items;
    CREATE TEMPORARY TABLE tmp_cart_items AS
    SELECT 
        ci.menu_item_id,
        ci.quantity,
        mi.name AS menu_item_name,
        mi.price,
        r.delivery_fee
    FROM Cart_Items ci
    INNER JOIN Menu_Items mi 
        ON ci.menu_item_id = mi.menu_item_id
       AND mi.is_available = TRUE
    INNER JOIN Restaurants r 
        ON mi.restaurant_id = r.restaurant_id
       AND r.restaurant_id = p_restaurant_id
    WHERE ci.customer_id = p_customer_id;

    -- Ensure snapshot is not empty
    SELECT COUNT(*) INTO v_tmp_count FROM tmp_cart_items;
    IF v_tmp_count = 0 THEN
        SET v_error_msg = CONCAT('No valid menu items found in cart for restaurant ', p_restaurant_id);
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error_msg;
    END IF;

    -- Calculate totals
    SELECT 
        SUM(quantity * price),
        MAX(delivery_fee)
    INTO 
        v_subtotal,
        v_delivery_fee
    FROM tmp_cart_items;

    IF v_subtotal IS NULL OR v_subtotal = 0 THEN
        SET v_error_msg = 'Cart items invalid or unavailable.';
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error_msg;
    END IF;

    SET v_tax = v_subtotal * 0.14;
    SET v_total_amount = v_subtotal + v_delivery_fee + v_tax;

    -- Create order WITH payment_method stored
    INSERT INTO Orders (
        customer_id, restaurant_id, delivery_address_id,
        subtotal, delivery_fee, tax, total_amount,
        special_instructions,
        status, payment_status, payment_method
    ) VALUES (
        p_customer_id, p_restaurant_id, p_address_id,
        v_subtotal, v_delivery_fee, v_tax, v_total_amount,
        p_special_instructions,
        'pending', 
        CASE WHEN p_payment_method = 'cash' THEN 'pending' ELSE 'processing' END,
        p_payment_method
    );

    SET v_order_id = LAST_INSERT_ID();

    -- Generate and update order number immediately
    UPDATE Orders
    SET order_number = CONCAT('ORD', DATE_FORMAT(NOW(), '%Y%m%d'), LPAD(v_order_id, 6, '0'))
    WHERE order_id = v_order_id;

    -- Insert order items
    INSERT INTO Order_Items (
        order_id,
        menu_item_id,
        menu_item_name,
        quantity,
        unit_price,
        subtotal
    )
    SELECT
        v_order_id,
        menu_item_id,
        menu_item_name,
        quantity,
        price,
        quantity * price
    FROM tmp_cart_items;

    SET v_items_inserted = ROW_COUNT();

    IF v_items_inserted = 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No items could be added to the order';
    END IF;

    -- Clear the cart AFTER everything is successfully inserted
    -- (Delete all cart items for this customer - they're all from same restaurant due to validation)
    DELETE FROM Cart_Items 
    WHERE customer_id = p_customer_id;

    COMMIT;
END$$

-- 2. Update order status (streamlined)
DROP PROCEDURE IF EXISTS sp_update_order_status$$
CREATE PROCEDURE sp_update_order_status(
    IN p_order_id INT,
    IN p_new_status VARCHAR(20),
    IN p_user_id INT,
    IN p_cancellation_reason TEXT
)
BEGIN
    DECLARE v_current_status VARCHAR(50);
    
    -- Validate status
    IF p_new_status NOT IN (
        'pending', 'confirmed', 'preparing', 'ready',
        'out_for_delivery', 'delivered', 'cancelled'
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Invalid order status';
    END IF;
    
    SELECT status
    INTO v_current_status
    FROM Orders 
    WHERE order_id = p_order_id;
    
    -- Validation checks
    IF v_current_status = 'cancelled' THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Cannot update a cancelled order';
    END IF;
    
    IF p_new_status = 'cancelled' AND v_current_status IN ('delivered', 'out_for_delivery') THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Cannot cancel order that is already out for delivery or delivered';
    END IF;
    
    IF p_new_status = 'confirmed' AND v_current_status != 'pending' THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Only pending orders can be confirmed';
    END IF;
        
    IF p_new_status = 'delivered' AND v_current_status != 'out_for_delivery' THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Only out_for_delivery orders can be marked as delivered';
    END IF;
    
    -- Update order status
    UPDATE Orders 
    SET status = p_new_status
    WHERE order_id = p_order_id;
END$$

-- 3. Assign driver to order (streamlined)
DROP PROCEDURE IF EXISTS sp_assign_driver$$
CREATE PROCEDURE sp_assign_driver(
    IN p_order_id INT,
    IN p_driver_id INT
)
BEGIN
    DECLARE v_order_status VARCHAR(50);
    DECLARE v_delivery_fee DECIMAL(10,2);
    DECLARE v_driver_available BOOLEAN;
    
    SELECT status, delivery_fee
    INTO v_order_status, v_delivery_fee
    FROM Orders 
    WHERE order_id = p_order_id;
    
    IF v_order_status NOT IN ('confirmed', 'preparing', 'ready') THEN
        SIGNAL SQLSTATE '45000' 
		SET MESSAGE_TEXT = 'Only confirmed/preparing/ready orders can be assigned to drivers';
    END IF;
    
    SELECT is_available INTO v_driver_available
    FROM Drivers 
    WHERE driver_id = p_driver_id;
    
    IF NOT v_driver_available THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Driver is not available';
    END IF;
    
   INSERT INTO Delivery_Assignments (
        order_id,
        driver_id,
        delivery_fee,
        driver_earnings,
        delivery_status
    ) VALUES (
        p_order_id,
        p_driver_id,
        v_delivery_fee,
        v_delivery_fee * 0.7,
        'assigned'
    );
    
    UPDATE Drivers 
    SET is_available = FALSE
    WHERE driver_id = p_driver_id;
END$$

-- 4. Add item to cart (no restaurant_id in Cart_Items)
DROP PROCEDURE IF EXISTS sp_add_to_cart$$
CREATE PROCEDURE sp_add_to_cart(
    IN p_customer_id INT,
    IN p_menu_item_id INT,
    IN p_quantity INT
)
BEGIN
    DECLARE v_restaurant_id INT;
    DECLARE v_current_restaurant_id INT;
    DECLARE v_is_available BOOLEAN;

    -- Validate quantity
    IF p_quantity <= 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Quantity must be greater than 0';
    END IF;

    -- Get menu item restaurant & availability
    SELECT restaurant_id, is_available
    INTO v_restaurant_id, v_is_available
    FROM Menu_Items 
    WHERE menu_item_id = p_menu_item_id;

    IF v_restaurant_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Menu item does not exist';
    END IF;

    IF v_is_available = FALSE THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Menu item is not available';
    END IF;

    -- Check if cart already has items from another restaurant
    -- (via JOIN to Menu_Items since Cart_Items no longer has restaurant_id)
    SELECT mi.restaurant_id 
    INTO v_current_restaurant_id
    FROM Cart_Items ci
    JOIN Menu_Items mi ON ci.menu_item_id = mi.menu_item_id
    WHERE ci.customer_id = p_customer_id
    LIMIT 1;

    IF v_current_restaurant_id IS NOT NULL 
       AND v_current_restaurant_id != v_restaurant_id THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot add items from different restaurants. Clear cart first.';
    END IF;

    -- Insert or update item in cart (no restaurant_id column)
    INSERT INTO Cart_Items (
        customer_id, 
        menu_item_id, 
        quantity
    )
    VALUES (
        p_customer_id, 
        p_menu_item_id, 
        p_quantity
    )
    ON DUPLICATE KEY UPDATE 
        quantity = quantity + p_quantity;
END$$

-- 5. Generate restaurant sales report (streamlined)
DROP PROCEDURE IF EXISTS sp_generate_sales_report$$
CREATE PROCEDURE sp_generate_sales_report(
    IN p_restaurant_id INT,
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    SELECT 
        DATE(o.order_date) as order_date,
        COUNT(*) as total_orders,
        SUM(o.total_amount) as total_revenue,
        AVG(o.total_amount) as avg_order_value,
        SUM(CASE WHEN o.status = 'delivered' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN o.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
        SUM(oi.quantity) as total_items_sold
    FROM Orders o
    JOIN Order_Items oi ON o.order_id = oi.order_id
    WHERE o.restaurant_id = p_restaurant_id
    AND DATE(o.order_date) BETWEEN p_start_date AND p_end_date
    GROUP BY DATE(o.order_date)
    ORDER BY order_date;
END$$

DELIMITER ;
