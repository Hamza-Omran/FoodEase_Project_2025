USE food_ordering_platform;

SET FOREIGN_KEY_CHECKS = 0;

-- Clear existing data (optional in dev)
TRUNCATE TABLE Activity_Logs;
TRUNCATE TABLE Coupon_Usage;
TRUNCATE TABLE Coupons;
TRUNCATE TABLE Notifications;
TRUNCATE TABLE Delivery_Assignments;
TRUNCATE TABLE Order_Status_History;
TRUNCATE TABLE Order_Items;
TRUNCATE TABLE Payments;
TRUNCATE TABLE Orders;
TRUNCATE TABLE Cart_Items;
TRUNCATE TABLE Menu_Item_Inventory;
TRUNCATE TABLE Menu_Items;
TRUNCATE TABLE Menu_Categories;
TRUNCATE TABLE Favorite_Restaurants;
TRUNCATE TABLE Customer_Addresses;
TRUNCATE TABLE Customers;
TRUNCATE TABLE Drivers;
TRUNCATE TABLE Employees;
TRUNCATE TABLE Restaurants;
TRUNCATE TABLE Users;
TRUNCATE TABLE order_sequence;

SET FOREIGN_KEY_CHECKS = 1;

-- Use variables to hold generated IDs instead of hard-coding PK=1,2,...
SET @admin_user_id := NULL;
SET @owner_user_id := NULL;
SET @customer_user_id := NULL;
SET @driver_user_id := NULL;

SET @customer_id := NULL;
SET @driver_id := NULL;

SET @rest1_id := NULL;
SET @rest2_id := NULL;

SET @addr1_id := NULL;
SET @addr2_id := NULL;

SET @cat1_id := NULL;
SET @cat2_id := NULL;
SET @cat3_id := NULL;
SET @cat4_id := NULL;

SET @mi1_id := NULL;
SET @mi2_id := NULL;
SET @mi3_id := NULL;
SET @mi4_id := NULL;
SET @mi5_id := NULL;

-- ============================================
-- USERS
-- ============================================

INSERT INTO Users (email, password_hash, role, phone, full_name, is_active, email_verified)
VALUES
  ('admin@foodease.local',
   '$2b$10$afJGWoyUnnZ6V94PqoozYucP/MDgCesGNo7/E1wYTk2/UUkN1BSjC',  -- admin password hash
   'admin',            '01000000001', 'Admin User',             1, 1),
  ('owner@foodease.local',
   '$2b$10$afJGWoyUnnZ6V94PqoozYucP/MDgCesGNo7/E1wYTk2/UUkN1BSjC',  -- owner password hash
   'restaurant_owner', '01000000002', 'Pizza Palace Owner',     1, 1),
  ('owner2@foodease.local',
   '$2b$10$afJGWoyUnnZ6V94PqoozYucP/MDgCesGNo7/E1wYTk2/UUkN1BSjC',  -- owner password hash
   'restaurant_owner', '01000000005', 'Sushi House Owner',     1, 1),
  ('owner3@foodease.local',
   '$2b$10$afJGWoyUnnZ6V94PqoozYucP/MDgCesGNo7/E1wYTk2/UUkN1BSjC',  -- owner password hash
   'restaurant_owner', '01000000006', 'Burger Hub Owner',     1, 1),
  ('owner4@foodease.local',
   '$2b$10$afJGWoyUnnZ6V94PqoozYucP/MDgCesGNo7/E1wYTk2/UUkN1BSjC',  -- owner password hash
   'restaurant_owner', '01000000007', 'Healthy Bites Owner',     1, 1),
  ('customer@foodease.local',
   '$2b$10$afJGWoyUnnZ6V94PqoozYucP/MDgCesGNo7/E1wYTk2/UUkN1BSjC',  -- customer password hash
   'customer',         '01000000003', 'Test Customer',          1, 1),
  ('driver@foodease.local',
   '$2b$10$afJGWoyUnnZ6V94PqoozYucP/MDgCesGNo7/E1wYTk2/UUkN1BSjC',  -- driver password hash
   'driver',           '01000000004', 'Test Driver',            1, 1);

-- Capture IDs (ordered by creation time)
SELECT user_id INTO @admin_user_id    FROM Users WHERE email='admin@foodease.local';
SELECT user_id INTO @owner_user_id    FROM Users WHERE email='owner@foodease.local';
SELECT user_id INTO @owner2_user_id   FROM Users WHERE email='owner2@foodease.local';
SELECT user_id INTO @owner3_user_id   FROM Users WHERE email='owner3@foodease.local';
SELECT user_id INTO @owner4_user_id   FROM Users WHERE email='owner4@foodease.local';
SELECT user_id INTO @customer_user_id FROM Users WHERE email='customer@foodease.local';
SELECT user_id INTO @driver_user_id   FROM Users WHERE email='driver@foodease.local';

-- Because of trg_create_customer_profile, a Customers row was auto-created for the customer user.
-- Ensure we know its id:
SELECT customer_id INTO @customer_id FROM Customers WHERE user_id = @customer_user_id;

-- If you prefer fixed initial stats, update that row instead of inserting with explicit PK
UPDATE Customers
SET loyalty_points = 25,
    total_orders   = 2,
    total_spent    = 350.00,
    preferred_payment_method = 'cash'
WHERE customer_id = @customer_id;

-- ============================================
-- ADDRESSES
-- ============================================

INSERT INTO Customer_Addresses (
  customer_id, address_label, street_address, apartment_number,
  city, state, postal_code, country, latitude, longitude, is_default, delivery_instructions
) VALUES
  (@customer_id, 'Home', '123 Nile St',  'Apt 4B', 'Cairo',  'Cairo', '12345', 'Egypt', NULL, NULL, 1, 'Ring the bell'),
  (@customer_id, 'Work', '456 Tahrir',   NULL,     'Cairo',  'Cairo', '12346', 'Egypt', NULL, NULL, 0, 'Call on arrival');

SELECT MIN(address_id) INTO @addr1_id FROM Customer_Addresses WHERE customer_id = @customer_id AND address_label='Home';
SELECT MIN(address_id) INTO @addr2_id FROM Customer_Addresses WHERE customer_id = @customer_id AND address_label='Work';

-- ============================================
-- DRIVERS
-- ============================================

INSERT INTO Drivers (
  user_id, vehicle_type, vehicle_model, license_plate,
  license_number, is_available, is_verified,
  current_latitude, current_longitude,
  rating, total_deliveries, completed_deliveries, cancelled_deliveries, earnings_total
) VALUES
  (@driver_user_id, 'bike', 'Honda', 'CAIRO-123', 'LIC-123', 1, 1, NULL, NULL, 4.8, 10, 9, 1, 750.00);

SELECT driver_id INTO @driver_id FROM Drivers WHERE user_id = @driver_user_id;

-- ============================================
-- RESTAURANTS (each owner has ONE restaurant max)
-- ============================================

INSERT INTO Restaurants (
  owner_id, name, slug, description, phone, email,
  street_address, city, state, postal_code,
  latitude, longitude, opening_time, closing_time, status,
  rating, total_reviews, image_url, banner_url,
  delivery_fee, minimum_order, estimated_delivery_time,
  cuisine_type, is_featured, commission_rate
) VALUES
  (@owner_user_id, 'Pizza Palace', 'pizza-palace',
   'Authentic Italian pizza with fresh ingredients.',
   '01111111111', 'pizza@palace.eg',
   '12 Main St', 'Cairo', 'Cairo', '12345',
   NULL, NULL, '10:00:00', '23:59:59', 'active',
   4.6, 128,
   NULL,  -- ✅ No external URL
   NULL,  -- ✅ No external URL
   20.00, 50.00, 30,
   'Italian', 1, 15.00
  ),
  (@owner2_user_id, 'Sushi House', 'sushi-house',
   'Fresh sushi and Japanese cuisine.',
   '01111111112', 'sushi@house.eg',
   '34 Sea Rd', 'Alexandria', 'Alex', '54321',
   NULL, NULL, '11:00:00', '23:00:00', 'active',
   4.8, 95,
   NULL,  -- ✅ No external URL
   NULL,  -- ✅ No external URL
   25.00, 50.00, 40,
   'Japanese', 1, 15.00
  ),
  (@owner3_user_id, 'Burger Hub', 'burger-hub',
   'Juicy burgers and fries.',
   '01111111113', 'burger@hub.eg',
   '56 Nile St', 'Giza', 'Giza', '67890',
   NULL, NULL, '09:00:00', '23:00:00', 'active',
   4.3, 60,
   NULL,  -- ✅ No external URL
   NULL,  -- ✅ No external URL
   15.00, 50.00, 35,
   'American', 0, 15.00
  ),
  (@owner4_user_id, 'Healthy Bites', 'healthy-bites',
   'Healthy salads and bowls.',
   '01111111114', 'healthy@bites.eg',
   '89 Green Rd', 'Cairo', 'Cairo', '55555',
   NULL, NULL, '10:00:00', '22:00:00', 'active',
   4.9, 40,
   NULL,  -- ✅ No external URL
   NULL,  -- ✅ No external URL
   18.00, 50.00, 25,
   'Healthy', 1, 15.00
  );

SELECT restaurant_id INTO @rest1_id FROM Restaurants WHERE slug='pizza-palace';
SELECT restaurant_id INTO @rest2_id FROM Restaurants WHERE slug='sushi-house';

-- ============================================
-- MENU CATEGORIES
-- ============================================

INSERT INTO Menu_Categories (restaurant_id, name, description, display_order, is_active)
VALUES
  (@rest1_id, 'Pizzas',         'Classic and specialty pizzas', 1, 1),
  (@rest1_id, 'Sides',          'Starters and sides',           2, 1),
  (@rest2_id, 'Sushi Rolls',    'Signature sushi rolls',        1, 1),
  (@rest2_id, 'Nigiri & Sashimi','Fresh fish on rice',          2, 1);

SELECT category_id INTO @cat1_id FROM Menu_Categories WHERE restaurant_id=@rest1_id AND name='Pizzas';
SELECT category_id INTO @cat2_id FROM Menu_Categories WHERE restaurant_id=@rest1_id AND name='Sides';
SELECT category_id INTO @cat3_id FROM Menu_Categories WHERE restaurant_id=@rest2_id AND name='Sushi Rolls';
SELECT category_id INTO @cat4_id FROM Menu_Categories WHERE restaurant_id=@rest2_id AND name='Nigiri & Sashimi';

-- ============================================
-- MENU ITEMS (using uploaded images)
-- ============================================

INSERT INTO Menu_Items (
  restaurant_id, category_id,
  name, slug, description, price, discount_price,
  image_url, is_available, is_featured, preparation_time,
  is_vegetarian, is_vegan, is_spicy, spice_level,
  calories, allergens, rating, total_reviews, total_orders
) VALUES
  -- Pizza Palace items (@rest1_id)
  (@rest1_id, @cat1_id,
   'Margherita Pizza', 'margherita-pizza',
   'Tomato sauce, mozzarella, fresh basil.',
   89.99, NULL,
   '/uploads/restaurants/pizza.jpeg',
   1, 1, 20,
   1, 0, 0, NULL,
   900, 'dairy,gluten', 4.7, 45, 120
  ),
  (@rest1_id, @cat1_id,
   'Pepperoni Pizza', 'pepperoni-pizza',
   'Tomato sauce, mozzarella, spicy pepperoni.',
   109.99, NULL,
   '/uploads/restaurants/pizza2.jpeg',
   1, 1, 25,
   0, 0, 1, 'medium',
   1100, 'dairy,gluten', 4.5, 60, 180
  ),
  (@rest1_id, @cat2_id,
   'Garlic Bread', 'garlic-bread',
   'Freshly baked bread with garlic butter.',
   39.99, NULL,
   NULL,
   1, 0, 10,
   1, 0, 0, NULL,
   400, 'gluten,dairy', 4.2, 20, 70
  );

-- Capture menu item IDs ✅ IMMEDIATELY after insert
SELECT menu_item_id INTO @mi1_id FROM Menu_Items WHERE slug='margherita-pizza' AND restaurant_id=@rest1_id LIMIT 1;
SELECT menu_item_id INTO @mi2_id FROM Menu_Items WHERE slug='pepperoni-pizza' AND restaurant_id=@rest1_id LIMIT 1;
SELECT menu_item_id INTO @mi3_id FROM Menu_Items WHERE slug='garlic-bread' AND restaurant_id=@rest1_id LIMIT 1;

-- Verify captures worked
IF @mi1_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Failed to capture Margherita Pizza menu_item_id';
END IF;

-- Inventory snapshot
INSERT INTO Menu_Item_Inventory (menu_item_id, stock_quantity, low_stock_threshold, last_restocked_at, last_restocked_quantity)
VALUES
  (@mi1_id, 50, 10, NOW(), 50),
  (@mi2_id, 40, 10, NOW(), 40),
  (@mi3_id, 60, 10, NOW(), 60);

-- ============================================
-- SIMPLE COUPON
-- ============================================

INSERT INTO Coupons (
  code, description, discount_type, discount_value,
  min_order_amount, max_discount_amount,
  usage_limit, usage_count, per_user_limit,
  applicable_to, restaurant_id, start_date, end_date,
  is_active, created_by
) VALUES
  ('WELCOME10', 'EGP 10 off for new users', 'fixed_amount', 10.00,
   50.00, 50.00,
   100, 0, 1,
   'all', NULL, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY),
   1, @admin_user_id
  );

-- ============================================
-- SAMPLE ORDER FOR TRACKING / MY ORDERS
-- ============================================

INSERT INTO order_sequence VALUES (NULL);

-- ✅ Use CALL sp_place_order instead of direct INSERT
-- First, add items to cart
DELETE FROM Cart_Items WHERE customer_id = @customer_id; -- Clear any existing cart

INSERT INTO Cart_Items (customer_id, restaurant_id, menu_item_id, quantity, special_requests)
VALUES
  (@customer_id, @rest1_id, @mi1_id, 1, 'No olives'),
  (@customer_id, @rest1_id, @mi2_id, 1, NULL);

-- Now place the order via stored procedure
CALL sp_place_order(
    @customer_id,
    @rest1_id,
    @addr1_id,
    'Please add extra cheese.',
    'cash',
    NULL
);

-- Get the order_id
SELECT order_id INTO @order1_id 
FROM Orders 
WHERE customer_id = @customer_id 
ORDER BY order_date DESC 
LIMIT 1;

-- Assign driver
INSERT INTO Delivery_Assignments (
  order_id, driver_id,
  assigned_at, delivery_status,
  delivery_fee, driver_earnings
) VALUES (
  @order1_id, @driver_id,
  NOW(), 'assigned',
  20.00, 14.00
);
