USE food_ordering_platform;

DELIMITER $$

-- 1. Place order from cart (robust, guarantees items)
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
    DECLARE v_discount DECIMAL(10,2) DEFAULT 0;
    DECLARE v_estimated_time INT;
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

    -- Check cart items exist for this restaurant
    SELECT COUNT(*) INTO v_cart_count
    FROM Cart_Items
    WHERE customer_id = p_customer_id AND restaurant_id = p_restaurant_id;

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
        ci.special_requests,
        mi.name          AS menu_item_name,
        mi.price,
        r.delivery_fee,
        r.estimated_delivery_time
    FROM Cart_Items ci
    INNER JOIN Menu_Items mi 
        ON ci.menu_item_id = mi.menu_item_id
       AND mi.restaurant_id = p_restaurant_id
       AND mi.is_available = TRUE
    INNER JOIN Restaurants r 
        ON ci.restaurant_id = r.restaurant_id
    WHERE ci.customer_id = p_customer_id
      AND ci.restaurant_id = p_restaurant_id;

    -- Ensure snapshot is not empty
    SELECT COUNT(*) INTO v_tmp_count FROM tmp_cart_items;
    IF v_tmp_count = 0 THEN
        SET v_error_msg = 'No valid items found in cart for this restaurant';
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error_msg;
    END IF;

    -- Calculate subtotal etc. from snapshot (no minimum_order check)
    SELECT 
        SUM(quantity * price),
        MAX(delivery_fee),
        MAX(estimated_delivery_time)
    INTO 
        v_subtotal,
        v_delivery_fee,
        v_estimated_time
    FROM tmp_cart_items;

    IF v_subtotal IS NULL OR v_subtotal = 0 THEN
        SET v_error_msg = 'Cart items invalid or unavailable.';
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error_msg;
    END IF;

    -- Calculate tax and total
    SET v_tax = v_subtotal * 0.14;
    SET v_total_amount = v_subtotal + v_delivery_fee + v_tax - v_discount;

    -- Create order
    INSERT INTO Orders (
        customer_id, restaurant_id, delivery_address_id,
        subtotal, delivery_fee, tax, discount, total_amount,
        special_instructions, estimated_delivery_time,
        status, payment_status
    ) VALUES (
        p_customer_id, p_restaurant_id, p_address_id,
        v_subtotal, v_delivery_fee, v_tax, v_discount, v_total_amount,
        p_special_instructions, DATE_ADD(NOW(), INTERVAL v_estimated_time MINUTE),
        'pending', CASE WHEN p_payment_method = 'cash' THEN 'pending' ELSE 'processing' END
    );

    SET v_order_id = LAST_INSERT_ID();

    -- Insert order items from the same snapshot
    INSERT INTO Order_Items (
        order_id,
        menu_item_id,
        menu_item_name,
        quantity,
        unit_price,
        subtotal,
        special_requests
    )
    SELECT
        v_order_id,
        menu_item_id,
        menu_item_name,
        quantity,
        price,
        quantity * price,
        special_requests
    FROM tmp_cart_items;

    SET v_items_inserted = ROW_COUNT();

    IF v_items_inserted = 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No items could be added to the order';
    END IF;

    -- Create payment record
    INSERT INTO Payments (order_id, payment_method, amount, payment_status)
    VALUES (
        v_order_id, 
        p_payment_method, 
        v_total_amount,
        CASE WHEN p_payment_method = 'cash' THEN 'pending' ELSE 'processing' END
    );

    COMMIT;
END$$

-- 2. Update order status
DROP PROCEDURE IF EXISTS sp_update_order_status$$
CREATE PROCEDURE sp_update_order_status(
    IN p_order_id INT,
    IN p_new_status VARCHAR(20),
    IN p_user_id INT,
    IN p_cancellation_reason TEXT
)
BEGIN
    DECLARE v_current_status VARCHAR(50);
    DECLARE v_restaurant_id INT;
    DECLARE v_customer_id INT;
    DECLARE v_driver_id INT;
    
    -- Validate status
    IF p_new_status NOT IN (
        'pending', 'confirmed', 'preparing', 'ready',
        'out_for_delivery', 'delivered', 'cancelled'
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Invalid order status';
    END IF;
    
    SELECT status, restaurant_id, customer_id
    INTO v_current_status, v_restaurant_id, v_customer_id
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
    SET status = p_new_status,
        cancelled_by = CASE WHEN p_new_status = 'cancelled' THEN p_user_id ELSE cancelled_by END,
        cancellation_reason = CASE WHEN p_new_status = 'cancelled' THEN p_cancellation_reason ELSE cancellation_reason END
    WHERE order_id = p_order_id;
    
    -- Get driver if needed
    IF p_new_status = 'out_for_delivery' THEN
        SELECT driver_id INTO v_driver_id
        FROM Delivery_Assignments
        WHERE order_id = p_order_id
        LIMIT 1;
    END IF;
    
    -- Send notifications based on status
    IF p_new_status = 'confirmed' THEN
        INSERT INTO Notifications (user_id, type, title, message, data)
        SELECT 
            u.user_id,
            'order_update',
            'Order Confirmed',
            CONCAT('Your order #', p_order_id, ' has been confirmed and is being prepared'),
            JSON_OBJECT('order_id', p_order_id)
        FROM Customers c
        JOIN Users u ON c.user_id = u.user_id
        WHERE c.customer_id = v_customer_id;
    END IF;
    
    IF p_new_status = 'preparing' THEN
        INSERT INTO Notifications (user_id, type, title, message, data)
        SELECT 
            u.user_id,
            'order_update',
            'Order Being Prepared',
            CONCAT('Restaurant has started preparing your order #', p_order_id),
            JSON_OBJECT('order_id', p_order_id)
        FROM Customers c
        JOIN Users u ON c.user_id = u.user_id
        WHERE c.customer_id = v_customer_id;
    END IF;
    
    IF p_new_status = 'ready' THEN
        INSERT INTO Notifications (user_id, type, title, message, data)
        SELECT 
            u.user_id,
            'order_update',
            'Order Ready for Pickup',
            CONCAT('Your order #', p_order_id, ' is ready for pickup/delivery'),
            JSON_OBJECT('order_id', p_order_id)
        FROM Customers c
        JOIN Users u ON c.user_id = u.user_id
        WHERE c.customer_id = v_customer_id;
    END IF;
    
    IF p_new_status = 'out_for_delivery' THEN
        INSERT INTO Notifications (user_id, type, title, message, data)
        SELECT 
            u.user_id,
            'delivery_update',
            'Order On The Way',
            CONCAT('Your order #', p_order_id, ' is out for delivery'),
            JSON_OBJECT('order_id', p_order_id)
        FROM Customers c
        JOIN Users u ON c.user_id = u.user_id
        WHERE c.customer_id = v_customer_id;
        
        IF v_driver_id IS NOT NULL THEN
            INSERT INTO Notifications (user_id, type, title, message, data)
            SELECT 
                u.user_id,
                'delivery_update',
                'Delivery Assignment',
                CONCAT('Order #', p_order_id, ' is ready for delivery'),
                JSON_OBJECT('order_id', p_order_id, 'status', 'out_for_delivery')
            FROM Drivers d
            JOIN Users u ON d.user_id = u.user_id
            WHERE d.driver_id = v_driver_id;
        END IF;
    END IF;
    
    IF p_new_status = 'delivered' THEN
        INSERT INTO Notifications (user_id, type, title, message, data)
        SELECT 
            u.user_id,
            'order_update',
            'Order Delivered',
            CONCAT('Your order #', p_order_id, ' has been delivered'),
            JSON_OBJECT('order_id', p_order_id)
        FROM Customers c
        JOIN Users u ON c.user_id = u.user_id
        WHERE c.customer_id = v_customer_id;
    END IF;
    
    IF p_new_status = 'cancelled' THEN
        INSERT INTO Notifications (user_id, type, title, message, data)
        SELECT 
            u.user_id,
            'order_update',
            'Order Cancelled',
            CONCAT('Your order #', p_order_id, ' has been cancelled'),
            JSON_OBJECT('order_id', p_order_id, 'reason', p_cancellation_reason)
        FROM Customers c
        JOIN Users u ON c.user_id = u.user_id
        WHERE c.customer_id = v_customer_id;
    END IF;
END$$

-- 3. Assign driver to order
DROP PROCEDURE IF EXISTS sp_assign_driver$$
CREATE PROCEDURE sp_assign_driver(
    IN p_order_id INT,
    IN p_driver_id INT
)
BEGIN
    DECLARE v_order_status VARCHAR(50);
    DECLARE v_restaurant_id INT;
    DECLARE v_delivery_fee DECIMAL(10,2);
    DECLARE v_driver_available BOOLEAN;
    
    SELECT status, restaurant_id, delivery_fee
    INTO v_order_status, v_restaurant_id, v_delivery_fee
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
    
    INSERT INTO Notifications (user_id, type, title, message, data)
    SELECT 
        u.user_id,
        'delivery_update',
        'New Delivery Assignment',
        CONCAT('You have been assigned to deliver order #', p_order_id),
        JSON_OBJECT('order_id', p_order_id, 'assignment_id', LAST_INSERT_ID())
    FROM Drivers d
    JOIN Users u ON d.user_id = u.user_id
    WHERE d.driver_id = p_driver_id;
END$$

-- 4. Add item to cart
DROP PROCEDURE IF EXISTS sp_add_to_cart$$
CREATE PROCEDURE sp_add_to_cart(
    IN p_customer_id INT,
    IN p_menu_item_id INT,
    IN p_quantity INT,
    IN p_special_requests TEXT
)
BEGIN
    DECLARE v_restaurant_id INT;
    DECLARE v_current_restaurant_id INT;
    DECLARE v_is_available BOOLEAN;
    DECLARE v_stock_quantity INT;
    DECLARE v_error_msg VARCHAR(255);

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

    -- Check stock
    SELECT stock_quantity 
    INTO v_stock_quantity
    FROM Menu_Item_Inventory
    WHERE menu_item_id = p_menu_item_id;

    IF v_stock_quantity IS NOT NULL AND v_stock_quantity < p_quantity THEN
        SET v_error_msg = CONCAT('Insufficient stock. Only ', v_stock_quantity, ' available');
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = v_error_msg;
    END IF;

    -- Check if cart already has items from another restaurant
    SELECT restaurant_id 
    INTO v_current_restaurant_id
    FROM Cart_Items 
    WHERE customer_id = p_customer_id
    LIMIT 1;

    IF v_current_restaurant_id IS NOT NULL 
       AND v_current_restaurant_id != v_restaurant_id THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot add items from different restaurants. Clear cart first.';
    END IF;

    -- Insert or update item in cart
    INSERT INTO Cart_Items (
        customer_id, 
        restaurant_id, 
        menu_item_id, 
        quantity, 
        special_requests
    )
    VALUES (
        p_customer_id, 
        v_restaurant_id, 
        p_menu_item_id, 
        p_quantity, 
        p_special_requests
    )
    ON DUPLICATE KEY UPDATE 
        quantity = quantity + p_quantity,
        special_requests = COALESCE(p_special_requests, special_requests),
        updated_at = CURRENT_TIMESTAMP;
END$$


-- 5. Process payment
DROP PROCEDURE IF EXISTS sp_process_payment$$
CREATE PROCEDURE sp_process_payment(
    IN p_order_id INT,
    IN p_transaction_id VARCHAR(255),
    IN p_payment_gateway VARCHAR(100),
    IN p_gateway_response TEXT,
    IN p_payment_status VARCHAR(20)
)
BEGIN
    DECLARE v_current_status VARCHAR(50);
    
     IF p_payment_status NOT IN ('pending', 'processing', 'completed', 'failed', 'refunded') THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Invalid payment status';
    END IF;
    
    SELECT status INTO v_current_status
    FROM Orders 
    WHERE order_id = p_order_id;
    
    IF v_current_status = 'cancelled' THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Cannot process payment for cancelled order';
    END IF;
    
    UPDATE Payments 
    SET payment_status = p_payment_status,
        transaction_id = p_transaction_id,
        payment_gateway = p_payment_gateway,
        gateway_response = p_gateway_response,
        paid_at = CASE WHEN p_payment_status = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END
    WHERE order_id = p_order_id;
    
    UPDATE Orders 
    SET payment_status = p_payment_status
    WHERE order_id = p_order_id;
    
    IF p_payment_status = 'completed' AND v_current_status = 'pending' THEN
        CALL sp_update_order_status(p_order_id, 'confirmed', NULL, NULL);
    END IF;
END$$

-- 6. Get order tracking details
DROP PROCEDURE IF EXISTS sp_get_order_tracking$$
CREATE PROCEDURE sp_get_order_tracking(
    IN p_order_id INT
)
BEGIN
    -- This resultset is shaped for frontend tracking UI
    SELECT 
        o.order_id,
        o.order_number,
        o.status,
        o.estimated_delivery_time,
        o.actual_delivery_time,
        r.name AS restaurant_name,
        r.phone AS restaurant_phone,
        ca.street_address AS delivery_address,
        CONCAT(u.full_name, ' - ', d.vehicle_model) AS driver_info,
        u.phone AS driver_phone,
        da.delivery_status,
        da.current_latitude,
        da.current_longitude,
        TIMESTAMPDIFF(MINUTE, o.order_date, NOW()) AS minutes_since_order
    FROM Orders o
    JOIN Restaurants r ON o.restaurant_id = r.restaurant_id
    JOIN Customer_Addresses ca ON o.delivery_address_id = ca.address_id
    LEFT JOIN Delivery_Assignments da ON o.order_id = da.order_id
    LEFT JOIN Drivers d ON da.driver_id = d.driver_id
    LEFT JOIN Users u ON d.user_id = u.user_id
    WHERE o.order_id = p_order_id;
END$$

-- 7. Generate restaurant sales report
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

-- 8. Get available drivers near restaurant
DROP PROCEDURE IF EXISTS sp_get_available_drivers$$
CREATE PROCEDURE sp_get_available_drivers(
    IN p_restaurant_id INT,
    IN p_radius_km DECIMAL(6,2)
)
BEGIN
    DECLARE v_restaurant_lat DECIMAL(10,8);
    DECLARE v_restaurant_lng DECIMAL(11,8);
    
    SELECT latitude, longitude 
    INTO v_restaurant_lat, v_restaurant_lng
    FROM Restaurants 
    WHERE restaurant_id = p_restaurant_id;
    
    SELECT 
        d.driver_id,
        u.full_name,
        d.vehicle_type,
        d.vehicle_model,
        d.rating,
        d.completed_deliveries
    FROM Drivers d
    JOIN Users u ON d.user_id = u.user_id
    WHERE d.is_available = TRUE
    AND d.is_verified = TRUE
    AND d.current_latitude IS NOT NULL
    AND d.current_longitude IS NOT NULL
    LIMIT 10;
END$$

-- 9. Add review
DROP PROCEDURE IF EXISTS sp_add_review$$
CREATE PROCEDURE sp_add_review(
    IN p_order_id INT,
    IN p_rating INT,
    IN p_comment TEXT,
    IN p_food_rating INT,
    IN p_delivery_rating INT
)
BEGIN
    DECLARE v_customer_id INT;
    DECLARE v_restaurant_id INT;
    DECLARE v_order_status VARCHAR(50);
    DECLARE v_already_reviewed BOOLEAN;
    
    SELECT customer_id, restaurant_id, status
    INTO v_customer_id, v_restaurant_id, v_order_status
    FROM Orders 
    WHERE order_id = p_order_id;
    
    IF v_order_status != 'delivered' THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Only delivered orders can be reviewed';
    END IF;
    
    SELECT (COUNT(*) > 0) INTO v_already_reviewed
    FROM Reviews 
    WHERE order_id = p_order_id;
    
    IF v_already_reviewed THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Order has already been reviewed';
    END IF;
    
    INSERT INTO Reviews (
        order_id,
        customer_id,
        restaurant_id,
        rating,
        food_rating,
        delivery_rating,
        comment
    ) VALUES (
        p_order_id,
        v_customer_id,
        v_restaurant_id,
        p_rating,
        p_food_rating,
        p_delivery_rating,
        p_comment
    );
    
    UPDATE Orders 
    SET rating = p_rating,
        review_comment = p_comment,
        reviewed_at = CURRENT_TIMESTAMP
    WHERE order_id = p_order_id;
END$$

DELIMITER ;