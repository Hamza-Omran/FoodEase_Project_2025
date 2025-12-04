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
  ('customer@foodease.local',
   '$2b$10$afJGWoyUnnZ6V94PqoozYucP/MDgCesGNo7/E1wYTk2/UUkN1BSjC',  -- customer password hash
   'customer',         '01000000003', 'Test Customer',          1, 1),
  ('driver@foodease.local',
   '$2b$10$afJGWoyUnnZ6V94PqoozYucP/MDgCesGNo7/E1wYTk2/UUkN1BSjC',  -- driver password hash
   'driver',           '01000000004', 'Test Driver',            1, 1);

-- Capture IDs (ordered by creation time)
SELECT user_id INTO @admin_user_id    FROM Users WHERE email='admin@foodease.local';
SELECT user_id INTO @owner_user_id    FROM Users WHERE email='owner@foodease.local';
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
-- RESTAURANTS
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
   'https://images.unsplash.com/photo-1601924582975-7aa6ec4c37aa?w=800',
   'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200',
   20.00, 50.00, 30,        -- minimum_order lowered from 80.00 to 50.00
   'Italian', 1, 15.00
  ),
  (@owner_user_id, 'Sushi House', 'sushi-house',
   'Fresh sushi and Japanese cuisine.',
   '01111111112', 'sushi@house.eg',
   '34 Sea Rd', 'Alexandria', 'Alex', '54321',
   NULL, NULL, '11:00:00', '23:00:00', 'active',
   4.8, 95,
   'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
   'https://images.unsplash.com/photo-1543353071-873f17a7a088?w=1200',
   25.00, 50.00, 40,        -- minimum_order lowered from 100.00 to 50.00
   'Japanese', 1, 15.00
  ),
  (@owner_user_id, 'Burger Hub', 'burger-hub',
   'Juicy burgers and fries.',
   '01111111113', 'burger@hub.eg',
   '56 Nile St', 'Giza', 'Giza', '67890',
   NULL, NULL, '09:00:00', '23:00:00', 'active',
   4.3, 60,
   'https://images.unsplash.com/photo-1550317138-10000687a72b?w=800',
   'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200',
   15.00, 50.00, 35,        -- minimum_order lowered from 70.00 to 50.00
   'American', 0, 15.00
  ),
  (@owner_user_id, 'Healthy Bites', 'healthy-bites',
   'Healthy salads and bowls.',
   '01111111114', 'healthy@bites.eg',
   '89 Green Rd', 'Cairo', 'Cairo', '55555',
   NULL, NULL, '10:00:00', '22:00:00', 'active',
   4.9, 40,
   'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
   'https://images.unsplash.com/photo-1504753793650-d4a2b783c15e?w=1200',
   18.00, 50.00, 25,        -- minimum_order lowered from 90.00 to 50.00
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
-- MENU ITEMS
-- ============================================

INSERT INTO Menu_Items (
  restaurant_id, category_id,
  name, slug, description, price, discount_price,
  image_url, is_available, is_featured, preparation_time,
  is_vegetarian, is_vegan, is_spicy, spice_level,
  calories, allergens, rating, total_reviews, total_orders
) VALUES
  (@rest1_id, @cat1_id,
   'Margherita Pizza', 'margherita-pizza',
   'Tomato sauce, mozzarella, fresh basil.',
   89.99, NULL,
   'https://images.unsplash.com/photo-1601924582975-7aa6ec4c37aa?w=800',
   1, 1, 20,
   1, 0, 0, NULL,
   900, 'dairy,gluten', 4.7, 45, 120
  ),
  (@rest1_id, @cat1_id,
   'Pepperoni Pizza', 'pepperoni-pizza',
   'Tomato sauce, mozzarella, spicy pepperoni.',
   109.99, NULL,
   'https://images.unsplash.com/photo-1548365328-9daaf8b4c093?w=800',
   1, 1, 25,
   0, 0, 1, 'medium',
   1100, 'dairy,gluten', 4.5, 60, 180
  ),
  (@rest1_id, @cat2_id,
   'Garlic Bread', 'garlic-bread',
   'Freshly baked bread with garlic butter.',
   39.99, NULL,
   'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
   1, 0, 10,
   1, 0, 0, NULL,
   400, 'gluten,dairy', 4.2, 20, 70
  ),
  (@rest2_id, @cat3_id,
   'California Roll', 'california-roll',
   'Crab, avocado, cucumber, sesame.',
   79.99, NULL,
   'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
   1, 1, 15,
   0, 0, 0, NULL,
   300, 'shellfish,sesame', 4.8, 80, 200
  ),
  (@rest2_id, @cat4_id,
   'Salmon Nigiri', 'salmon-nigiri',
   'Fresh salmon on seasoned rice.',
   59.99, NULL,
   'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
   1, 0, 12,
   0, 0, 0, NULL,
   250, 'fish', 4.9, 40, 90
  );

SELECT menu_item_id INTO @mi1_id FROM Menu_Items WHERE slug='margherita-pizza';
SELECT menu_item_id INTO @mi2_id FROM Menu_Items WHERE slug='pepperoni-pizza';
SELECT menu_item_id INTO @mi3_id FROM Menu_Items WHERE slug='garlic-bread';
SELECT menu_item_id INTO @mi4_id FROM Menu_Items WHERE slug='california-roll';
SELECT menu_item_id INTO @mi5_id FROM Menu_Items WHERE slug='salmon-nigiri';

-- Inventory snapshot
INSERT INTO Menu_Item_Inventory (menu_item_id, stock_quantity, low_stock_threshold, last_restocked_at, last_restocked_quantity)
VALUES
  (@mi1_id, 50, 10, NOW(), 50),
  (@mi2_id, 40, 10, NOW(), 40),
  (@mi3_id, 60, 10, NOW(), 60),
  (@mi4_id, 50, 10, NOW(), 50),
  (@mi5_id, 50, 10, NOW(), 50);

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

-- Use customer_id & rest1_id captured earlier
INSERT INTO Orders (
  customer_id, restaurant_id, delivery_address_id,
  order_date, status, payment_status,
  subtotal, delivery_fee, tax, discount,
  loyalty_points_used, loyalty_discount,
  total_amount, special_instructions,
  estimated_prep_time, estimated_delivery_time
) VALUES (
  @customer_id, @rest1_id, @addr1_id,
  NOW(), 'preparing', 'pending',
  199.98, 20.00, 27.99, 0.00,
  0, 0.00,
  247.97, 'Please add extra cheese.',
  25, DATE_ADD(NOW(), INTERVAL 45 MINUTE)
);

SET @order1_id := LAST_INSERT_ID();

INSERT INTO Order_Items (
  order_id, menu_item_id, menu_item_name,
  quantity, unit_price, subtotal, special_requests
) VALUES
  (@order1_id, @mi1_id, 'Margherita Pizza', 1, 89.99, 89.99, 'No olives'),
  (@order1_id, @mi2_id, 'Pepperoni Pizza', 1, 109.99, 109.99, NULL);

INSERT INTO Payments (
  order_id, payment_method, payment_status,
  amount, transaction_id, payment_gateway, gateway_response,
  paid_at, refund_amount, refunded_at, refund_reason,
  failure_reason, retry_count
) VALUES
  (@order1_id, 'cash', 'pending',
   247.97, NULL, NULL, NULL,
   NULL, 0.00, NULL, NULL,
   NULL, 0);

INSERT INTO Delivery_Assignments (
  order_id, driver_id,
  assigned_at, accepted_at, pickup_time, delivery_time,
  delivery_status,
  pickup_latitude, pickup_longitude, delivery_latitude, delivery_longitude,
  current_latitude, current_longitude,
  distance_km, delivery_fee, driver_earnings,
  rejection_reason, failure_reason, notes
) VALUES
  (@order1_id, @driver_id,
   NOW(), NULL, NULL, NULL,
   'assigned',
   NULL, NULL, NULL, NULL,
   NULL, NULL,
   NULL, 20.00, 14.00,
   NULL, NULL, NULL
  );
