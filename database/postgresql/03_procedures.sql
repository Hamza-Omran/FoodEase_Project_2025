-- ============================================
-- FOODEASE PLATFORM - PostgreSQL Stored Procedures
-- Converted from MySQL procedures to PostgreSQL functions
-- ============================================

-- ============================================
-- 1. PLACE ORDER FROM CART
-- ============================================

CREATE OR REPLACE FUNCTION sp_place_order(
    p_customer_id INTEGER,
    p_restaurant_id INTEGER,
    p_address_id INTEGER,
    p_special_instructions TEXT,
    p_payment_method VARCHAR(20),
    p_coupon_code VARCHAR(50)
)
RETURNS INTEGER AS $$
DECLARE
    v_order_id INTEGER;
    v_subtotal DECIMAL(10,2);
    v_delivery_fee DECIMAL(10,2);
    v_tax DECIMAL(10,2);
    v_total_amount DECIMAL(10,2);
    v_cart_count INTEGER;
    v_tmp_count INTEGER;
    v_items_inserted INTEGER;
    v_order_number VARCHAR(50);
BEGIN
    -- Validate payment method
    IF p_payment_method NOT IN ('cash', 'credit_card', 'debit_card', 'mobile_wallet', 'online') THEN
        RAISE EXCEPTION 'Invalid payment method';
    END IF;

    -- Check cart items exist for this restaurant
    SELECT COUNT(*) INTO v_cart_count
    FROM Cart_Items ci
    JOIN Menu_Items mi ON ci.menu_item_id = mi.menu_item_id
    WHERE ci.customer_id = p_customer_id AND mi.restaurant_id = p_restaurant_id;

    IF v_cart_count = 0 THEN
        RAISE EXCEPTION 'Cart is empty for this restaurant';
    END IF;

    -- Create temporary table for cart snapshot
    CREATE TEMP TABLE IF NOT EXISTS tmp_cart_items (
        menu_item_id INTEGER,
        quantity INTEGER,
        menu_item_name VARCHAR(255),
        price DECIMAL(10,2),
        delivery_fee DECIMAL(10,2)
    ) ON COMMIT DROP;

    -- Snapshot valid cart items
    INSERT INTO tmp_cart_items
    SELECT 
        ci.menu_item_id,
        ci.quantity,
        mi.name,
        mi.price,
        r.delivery_fee
    FROM Cart_Items ci
    INNER JOIN Menu_Items mi ON ci.menu_item_id = mi.menu_item_id AND mi.is_available = TRUE
    INNER JOIN Restaurants r ON mi.restaurant_id = r.restaurant_id AND r.restaurant_id = p_restaurant_id
    WHERE ci.customer_id = p_customer_id;

    -- Ensure snapshot is not empty
    SELECT COUNT(*) INTO v_tmp_count FROM tmp_cart_items;
    IF v_tmp_count = 0 THEN
        RAISE EXCEPTION 'No valid menu items found in cart for restaurant %', p_restaurant_id;
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
        RAISE EXCEPTION 'Cart items invalid or unavailable';
    END IF;

    v_tax := v_subtotal * 0.14;
    v_total_amount := v_subtotal + v_delivery_fee + v_tax;

    -- Create order
    INSERT INTO Orders (
        customer_id, restaurant_id, delivery_address_id,
        subtotal, delivery_fee, tax, total_amount,
        special_instructions,
        status, payment_status, payment_method
    ) VALUES (
        p_customer_id, p_restaurant_id, p_address_id,
        v_subtotal, v_delivery_fee, v_tax, v_total_amount,
        p_special_instructions,
        'pending'::order_status, 
        CASE WHEN p_payment_method = 'cash' THEN 'pending'::payment_status_type ELSE 'completed'::payment_status_type END,
        p_payment_method::payment_method_type
    )
    RETURNING order_id INTO v_order_id;

    -- Generate order number
    v_order_number := 'ORD' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD(v_order_id::TEXT, 6, '0');
    
    UPDATE Orders
    SET order_number = v_order_number
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

    GET DIAGNOSTICS v_items_inserted = ROW_COUNT;

    IF v_items_inserted = 0 THEN
        RAISE EXCEPTION 'No items could be added to the order';
    END IF;

    -- Clear the cart
    DELETE FROM Cart_Items 
    WHERE customer_id = p_customer_id;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. UPDATE ORDER STATUS
-- ============================================

CREATE OR REPLACE FUNCTION sp_update_order_status(
    p_order_id INTEGER,
    p_new_status VARCHAR(20),
    p_user_id INTEGER,
    p_cancellation_reason TEXT
)
RETURNS VOID AS $$
DECLARE
    v_current_status order_status;
BEGIN
    -- Validate status
    IF p_new_status NOT IN (
        'pending', 'confirmed', 'preparing', 'ready',
        'out_for_delivery', 'delivered', 'cancelled'
    ) THEN
        RAISE EXCEPTION 'Invalid order status';
    END IF;
    
    SELECT status INTO v_current_status
    FROM Orders 
    WHERE order_id = p_order_id;
    
    -- Validation checks
    IF v_current_status = 'cancelled' THEN
        RAISE EXCEPTION 'Cannot update a cancelled order';
    END IF;
    
    IF p_new_status = 'cancelled' AND v_current_status IN ('delivered', 'out_for_delivery') THEN
        RAISE EXCEPTION 'Cannot cancel order that is already out for delivery or delivered';
    END IF;
    
    IF p_new_status = 'confirmed' AND v_current_status != 'pending' THEN
        RAISE EXCEPTION 'Only pending orders can be confirmed';
    END IF;
        
    IF p_new_status = 'delivered' AND v_current_status != 'out_for_delivery' THEN
        RAISE EXCEPTION 'Only out_for_delivery orders can be marked as delivered';
    END IF;
    
    -- Update order status
    UPDATE Orders 
    SET status = p_new_status::order_status
    WHERE order_id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. ASSIGN DRIVER TO ORDER
-- ============================================

CREATE OR REPLACE FUNCTION sp_assign_driver(
    p_order_id INTEGER,
    p_driver_id INTEGER
)
RETURNS VOID AS $$
DECLARE
    v_order_status order_status;
    v_delivery_fee DECIMAL(10,2);
    v_driver_available BOOLEAN;
BEGIN
    SELECT status, delivery_fee
    INTO v_order_status, v_delivery_fee
    FROM Orders 
    WHERE order_id = p_order_id;
    
    IF v_order_status NOT IN ('confirmed', 'preparing', 'ready') THEN
        RAISE EXCEPTION 'Only confirmed/preparing/ready orders can be assigned to drivers';
    END IF;
    
    SELECT is_available INTO v_driver_available
    FROM Drivers 
    WHERE driver_id = p_driver_id;
    
    IF NOT v_driver_available THEN
        RAISE EXCEPTION 'Driver is not available';
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
        'assigned'::delivery_status_type
    );
    
    UPDATE Drivers 
    SET is_available = FALSE
    WHERE driver_id = p_driver_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. ADD ITEM TO CART
-- ============================================

CREATE OR REPLACE FUNCTION sp_add_to_cart(
    p_customer_id INTEGER,
    p_menu_item_id INTEGER,
    p_quantity INTEGER
)
RETURNS VOID AS $$
DECLARE
    v_restaurant_id INTEGER;
    v_current_restaurant_id INTEGER;
    v_is_available BOOLEAN;
BEGIN
    -- Validate quantity
    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'Quantity must be greater than 0';
    END IF;

    -- Get menu item restaurant & availability
    SELECT restaurant_id, is_available
    INTO v_restaurant_id, v_is_available
    FROM Menu_Items 
    WHERE menu_item_id = p_menu_item_id;

    IF v_restaurant_id IS NULL THEN
        RAISE EXCEPTION 'Menu item does not exist';
    END IF;

    IF v_is_available = FALSE THEN
        RAISE EXCEPTION 'Menu item is not available';
    END IF;

    -- Check if cart already has items from another restaurant
    SELECT mi.restaurant_id 
    INTO v_current_restaurant_id
    FROM Cart_Items ci
    JOIN Menu_Items mi ON ci.menu_item_id = mi.menu_item_id
    WHERE ci.customer_id = p_customer_id
    LIMIT 1;

    IF v_current_restaurant_id IS NOT NULL 
       AND v_current_restaurant_id != v_restaurant_id THEN
        RAISE EXCEPTION 'Cannot add items from different restaurants. Clear cart first.';
    END IF;

    -- Insert or update item in cart
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
    ON CONFLICT (customer_id, menu_item_id) 
    DO UPDATE SET quantity = Cart_Items.quantity + p_quantity;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. GENERATE RESTAURANT SALES REPORT
-- ============================================

CREATE OR REPLACE FUNCTION sp_generate_sales_report(
    p_restaurant_id INTEGER,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    order_date DATE,
    total_orders BIGINT,
    total_revenue DECIMAL(10,2),
    avg_order_value DECIMAL(10,2),
    completed_orders BIGINT,
    cancelled_orders BIGINT,
    total_items_sold BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.order_date::DATE as order_date,
        COUNT(*)::BIGINT as total_orders,
        SUM(o.total_amount) as total_revenue,
        AVG(o.total_amount) as avg_order_value,
        SUM(CASE WHEN o.status = 'delivered' THEN 1 ELSE 0 END)::BIGINT as completed_orders,
        SUM(CASE WHEN o.status = 'cancelled' THEN 1 ELSE 0 END)::BIGINT as cancelled_orders,
        SUM(oi.quantity)::BIGINT as total_items_sold
    FROM Orders o
    JOIN Order_Items oi ON o.order_id = oi.order_id
    WHERE o.restaurant_id = p_restaurant_id
    AND o.order_date::DATE BETWEEN p_start_date AND p_end_date
    GROUP BY o.order_date::DATE
    ORDER BY order_date;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- NOTES
-- ============================================
-- PostgreSQL function differences from MySQL:
-- 1. PROCEDURE → FUNCTION with RETURNS type
-- 2. BEGIN...END stays the same but needs $$ delimiters
-- 3. DECLARE section before BEGIN
-- 4. DELIMITER not needed (use $$)
-- 5. SIGNAL SQLSTATE → RAISE EXCEPTION
-- 6. LAST_INSERT_ID() → RETURNING clause
-- 7. ON DUPLICATE KEY UPDATE → ON CONFLICT DO UPDATE
-- 8. DATE_FORMAT → TO_CHAR
-- 9. ROW_COUNT() → GET DIAGNOSTICS
-- 10. Temp tables: CREATE TEMP TABLE ... ON COMMIT DROP
-- ============================================
