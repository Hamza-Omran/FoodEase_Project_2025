-- ============================================
-- FOODEASE PLATFORM - PostgreSQL Sample Data
-- Converted from MySQL sample data
-- ============================================

-- Truncate all tables (PostgreSQL CASCADE handles dependencies)
TRUNCATE TABLE Delivery_Assignments CASCADE;
TRUNCATE TABLE Order_Items CASCADE;
TRUNCATE TABLE Orders CASCADE;
TRUNCATE TABLE Cart_Items CASCADE;
TRUNCATE TABLE Menu_Item_Reviews CASCADE;
TRUNCATE TABLE Restaurant_Reviews CASCADE;
TRUNCATE TABLE Menu_Items CASCADE;
TRUNCATE TABLE Menu_Categories CASCADE;
TRUNCATE TABLE Favorite_Restaurants CASCADE;
TRUNCATE TABLE Customer_Addresses CASCADE;
TRUNCATE TABLE Customers CASCADE;
TRUNCATE TABLE Drivers CASCADE;
TRUNCATE TABLE Restaurants CASCADE;
TRUNCATE TABLE Users CASCADE;

-- PostgreSQL doesn't have user variables like MySQL
-- We'll use WITH clauses and RETURNING to capture IDs

-- ============================================
-- USERS
-- ============================================

WITH inserted_users AS (
    INSERT INTO Users (email, password_hash, role, phone, full_name, is_active)
    VALUES
      ('admin@foodease.local',
       '$2b$10$afJGWoyUnnZ6V94PqoozYucP/MDgCesGNo7/E1wYTk2/UUkN1BSjC',
       'admin', '01000000001', 'Admin User', TRUE),
      ('owner@foodease.local',
       '$2b$10$afJGWoyUnnZ6V94PqoozYucP/MDgCesGNo7/E1wYTk2/UUkN1BSjC',
       'restaurant_owner', '01000000002', 'Pizza Palace Owner', TRUE),
      ('owner2@foodease.local',
       '$2b$10$afJGWoyUnnZ6V94PqoozYucP/MDgCesGNo7/E1wYTk2/UUkN1BSjC',
       'restaurant_owner', '01000000005', 'Sushi House Owner', TRUE),
      ('owner3@foodease.local',
       '$2b$10$afJGWoyUnnZ6V94PqoozYucP/MDgCesGNo7/E1wYTk2/UUkN1BSjC',
       'restaurant_owner', '01000000006', 'Burger Hub Owner', TRUE),
      ('owner4@foodease.local',
       '$2b$10$afJGWoyUnnZ6V94PqoozYucP/MDgCesGNo7/E1wYTk2/UUkN1BSjC',
       'restaurant_owner', '01000000007', 'Healthy Bites Owner', TRUE),
      ('customer@foodease.local',
       '$2b$10$afJGWoyUnnZ6V94PqoozYucP/MDgCesGNo7/E1wYTk2/UUkN1BSjC',
       'customer', '01000000003', 'Test Customer', TRUE),
      ('driver@foodease.local',
       '$2b$10$afJGWoyUnnZ6V94PqoozYucP/MDgCesGNo7/E1wYTk2/UUkN1BSjC',
       'driver', '01000000004', 'Test Driver', TRUE)
    RETURNING user_id, email
)
SELECT * FROM inserted_users;

-- Update customer stats (customer profile auto-created by trigger)
UPDATE Customers
SET loyalty_points = 25,
    total_orders = 2,
    total_spent = 350.00
WHERE user_id = (SELECT user_id FROM Users WHERE email='customer@foodease.local');

-- ============================================
-- CUSTOMER ADDRESSES
-- ============================================

INSERT INTO Customer_Addresses (
  customer_id, street_address, apartment_number,
  city, state, is_default, delivery_instructions
)
SELECT 
  c.customer_id, '123 Nile St', 'Apt 4B', 'Cairo', 'Cairo', TRUE, 'Ring the bell'
FROM Customers c
JOIN Users u ON c.user_id = u.user_id
WHERE u.email = 'customer@foodease.local'

UNION ALL

SELECT 
  c.customer_id, '456 Tahrir', NULL, 'Cairo', 'Cairo', FALSE, 'Call on arrival'
FROM Customers c
JOIN Users u ON c.user_id = u.user_id
WHERE u.email = 'customer@foodease.local';

-- ============================================
-- DRIVERS
-- ============================================

INSERT INTO Drivers (
  user_id, vehicle_type, vehicle_model, license_plate,
  license_number, is_available,
  total_deliveries, completed_deliveries
)
SELECT 
  user_id, 'bike', 'Honda', 'CAIRO-123', 'LIC-123', TRUE, 10, 9
FROM Users
WHERE email = 'driver@foodease.local';

-- ============================================
-- RESTAURANTS
-- ============================================

INSERT INTO Restaurants (
  owner_id, name, description, phone, email,
  street_address, city, status,
  image_url, banner_url,
  delivery_fee, minimum_order, estimated_delivery_time,
  cuisine_type, is_featured
)
SELECT 
  user_id, 'Pizza Palace',
  'Authentic Italian pizza with fresh ingredients.',
  '01111111111', 'pizza@palace.eg',
  '12 Main St', 'Cairo', 'active'::restaurant_status,
  '/uploads/restaurants/download.jpeg', '/uploads/restaurants/download.jpeg',
  20.00, 50.00, 30, 'Italian', TRUE
FROM Users WHERE email = 'owner@foodease.local'

UNION ALL

SELECT 
  user_id, 'Sushi House',
  'Fresh sushi and Japanese cuisine.',
  '01111111112', 'sushi@house.eg',
  '34 Sea Rd', 'Alexandria', 'active'::restaurant_status,
  '/uploads/restaurants/download%20(1).jpeg', '/uploads/restaurants/download%20(1).jpeg',
  25.00, 50.00, 40, 'Japanese', TRUE
FROM Users WHERE email = 'owner2@foodease.local'

UNION ALL

SELECT 
  user_id, 'Burger Hub',
  'Juicy burgers and fries.',
  '01111111113', 'burger@hub.eg',
  '56 Nile St', 'Giza', 'active'::restaurant_status,
  '/uploads/restaurants/download%20(2).jpeg', '/uploads/restaurants/download%20(2).jpeg',
  15.00, 50.00, 35, 'American', FALSE
FROM Users WHERE email = 'owner3@foodease.local'

UNION ALL

SELECT 
  user_id, 'Healthy Bites',
  'Healthy salads and pasta.',
  '01111111114', 'healthy@bites.eg',
  '89 Green Rd', 'Cairo', 'active'::restaurant_status,
  '/uploads/restaurants/download%20(3).jpeg', '/uploads/restaurants/download%20(3).jpeg',
  18.00, 50.00, 25, 'Healthy', TRUE
FROM Users WHERE email = 'owner4@foodease.local';

-- ============================================
-- MENU CATEGORIES
-- ============================================

INSERT INTO Menu_Categories (restaurant_id, name, description)
SELECT r.restaurant_id, 'Pizzas', 'Classic and specialty pizzas'
FROM Restaurants r WHERE r.name='Pizza Palace'

UNION ALL

SELECT r.restaurant_id, 'Sides', 'Starters and sides'
FROM Restaurants r WHERE r.name='Pizza Palace'

UNION ALL

SELECT r.restaurant_id, 'Sushi Rolls', 'Signature sushi rolls'
FROM Restaurants r WHERE r.name='Sushi House'

UNION ALL

SELECT r.restaurant_id, 'Nigiri & Sashimi', 'Fresh fish on rice'
FROM Restaurants r WHERE r.name='Sushi House'

UNION ALL

SELECT r.restaurant_id, 'Burgers', 'Juicy burgers'
FROM Restaurants r WHERE r.name='Burger Hub'

UNION ALL

SELECT r.restaurant_id, 'Pasta', 'Italian pasta dishes'
FROM Restaurants r WHERE r.name='Healthy Bites';

-- ============================================
-- MENU ITEMS
-- ============================================

-- Pizza Palace menu items
INSERT INTO Menu_Items (restaurant_id, category_id, name, description, price, image_url, is_available)
SELECT 
  r.restaurant_id,
  (SELECT category_id FROM Menu_Categories WHERE name='Pizzas' AND restaurant_id=r.restaurant_id),
  'Margherita Pizza',
  'Tomato sauce, mozzarella, fresh basil.',
  89.99,
  '/uploads/menu-items/pizza.jpeg',
  TRUE
FROM Restaurants r WHERE r.name='Pizza Palace'

UNION ALL

SELECT 
  r.restaurant_id,
  (SELECT category_id FROM Menu_Categories WHERE name='Pizzas' AND restaurant_id=r.restaurant_id),
  'Pepperoni Pizza',
  'Tomato sauce, mozzarella, spicy pepperoni.',
  109.99,
  '/uploads/menu-items/pizza2.jpeg',
  TRUE
FROM Restaurants r WHERE r.name='Pizza Palace'

UNION ALL

SELECT 
  r.restaurant_id,
  (SELECT category_id FROM Menu_Categories WHERE name='Sides' AND restaurant_id=r.restaurant_id),
  'Garlic Bread',
  'Freshly baked bread with garlic butter.',
  39.99,
  '/uploads/menu-items/pizza3.jpeg',
  TRUE
FROM Restaurants r WHERE r.name='Pizza Palace'

UNION ALL

-- Sushi House menu items
SELECT 
  r.restaurant_id,
  (SELECT category_id FROM Menu_Categories WHERE name='Sushi Rolls' AND restaurant_id=r.restaurant_id),
  'California Roll',
  'Crab, avocado, cucumber.',
  120.00,
  '/uploads/menu-items/sushi.jpeg',
  TRUE
FROM Restaurants r WHERE r.name='Sushi House'

UNION ALL

SELECT 
  r.restaurant_id,
  (SELECT category_id FROM Menu_Categories WHERE name='Sushi Rolls' AND restaurant_id=r.restaurant_id),
  'Spicy Tuna Roll',
  'Fresh tuna with spicy mayo.',
  140.00,
  '/uploads/menu-items/sushi2.jpeg',
  TRUE
FROM Restaurants r WHERE r.name='Sushi House'

UNION ALL

SELECT 
  r.restaurant_id,
  (SELECT category_id FROM Menu_Categories WHERE name='Nigiri & Sashimi' AND restaurant_id=r.restaurant_id),
  'Salmon Nigiri',
  'Fresh salmon on rice.',
  80.00,
  '/uploads/menu-items/shushi.jpeg',
  TRUE
FROM Restaurants r WHERE r.name='Sushi House'

UNION ALL

-- Burger Hub menu items
SELECT 
  r.restaurant_id,
  (SELECT category_id FROM Menu_Categories WHERE name='Burgers' AND restaurant_id=r.restaurant_id),
  'Classic Burger',
  'Juicy beef patty with fresh toppings.',
  79.99,
  '/uploads/menu-items/burger.jpeg',
  TRUE
FROM Restaurants r WHERE r.name='Burger Hub'

UNION ALL

SELECT 
  r.restaurant_id,
  (SELECT category_id FROM Menu_Categories WHERE name='Burgers' AND restaurant_id=r.restaurant_id),
  'Cheese Burger',
  'Double cheese with special sauce.',
  89.99,
  '/uploads/menu-items/burger2.jpeg',
  TRUE
FROM Restaurants r WHERE r.name='Burger Hub'

UNION ALL

SELECT 
  r.restaurant_id,
  (SELECT category_id FROM Menu_Categories WHERE name='Burgers' AND restaurant_id=r.restaurant_id),
  'Mega Burger',
  'Triple patty with bacon and cheese.',
  119.99,
  '/uploads/menu-items/burger3.jpeg',
  TRUE
FROM Restaurants r WHERE r.name='Burger Hub'

UNION ALL

-- Healthy Bites menu items
SELECT 
  r.restaurant_id,
  (SELECT category_id FROM Menu_Categories WHERE name='Pasta' AND restaurant_id=r.restaurant_id),
  'Spaghetti Carbonara',
  'Classic Italian pasta with creamy sauce.',
  95.00,
  '/uploads/menu-items/spaghetti.jpeg',
  TRUE
FROM Restaurants r WHERE r.name='Healthy Bites'

UNION ALL

SELECT 
  r.restaurant_id,
  (SELECT category_id FROM Menu_Categories WHERE name='Pasta' AND restaurant_id=r.restaurant_id),
  'Spaghetti Bolognese',
  'Rich meat sauce with Italian herbs.',
  99.00,
  '/uploads/menu-items/spaghetti2.jpeg',
  TRUE
FROM Restaurants r WHERE r.name='Healthy Bites'

UNION ALL

SELECT 
  r.restaurant_id,
  (SELECT category_id FROM Menu_Categories WHERE name='Pasta' AND restaurant_id=r.restaurant_id),
  'Spaghetti Marinara',
  'Fresh seafood with tomato sauce.',
  115.00,
  '/uploads/menu-items/spaghetti3.jpeg',
  TRUE
FROM Restaurants r WHERE r.name='Healthy Bites'

UNION ALL

SELECT 
  r.restaurant_id,
  (SELECT category_id FROM Menu_Categories WHERE name='Pasta' AND restaurant_id=r.restaurant_id),
  'Pasta Primavera',
  'Vegetable pasta with olive oil.',
  89.00,
  '/uploads/menu-items/spaghetti4.jpeg',
  TRUE
FROM Restaurants r WHERE r.name='Healthy Bites';

-- ============================================
-- SAMPLE CART
-- ============================================

INSERT INTO Cart_Items (customer_id, menu_item_id, quantity)
SELECT 
  c.customer_id,
  mi.menu_item_id,
  1
FROM Customers c
JOIN Users u ON c.user_id = u.user_id
CROSS JOIN Menu_Items mi
WHERE u.email = 'customer@foodease.local'
AND mi.name IN ('Margherita Pizza', 'Pepperoni Pizza');

-- ============================================
-- SAMPLE ORDER
-- ============================================

-- Place an order using the stored procedure
DO $$
DECLARE
  v_customer_id INTEGER;
  v_restaurant_id INTEGER;
  v_address_id INTEGER;
  v_order_id INTEGER;
  v_driver_id INTEGER;
BEGIN
  -- Get IDs
  SELECT c.customer_id INTO v_customer_id
  FROM Customers c
  JOIN Users u ON c.user_id = u.user_id
  WHERE u.email = 'customer@foodease.local';
  
  SELECT restaurant_id INTO v_restaurant_id
  FROM Restaurants WHERE name = 'Pizza Palace';
  
  SELECT address_id INTO v_address_id
  FROM Customer_Addresses
  WHERE customer_id = v_customer_id AND is_default = TRUE
  LIMIT 1;
  
  SELECT driver_id INTO v_driver_id
  FROM Drivers d
  JOIN Users u ON d.user_id = u.user_id
  WHERE u.email = 'driver@foodease.local';

  -- Place order
  v_order_id := sp_place_order(
    v_customer_id,
    v_restaurant_id,
    v_address_id,
    'Please add extra cheese.',
    'cash',
    NULL
  );

  -- Assign driver
  INSERT INTO Delivery_Assignments (
    order_id, driver_id, delivery_status, delivery_fee, driver_earnings
  ) VALUES (
    v_order_id, v_driver_id, 'assigned', 20.00, 14.00
  );
END $$;

-- Reset sequences to current max values
SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM Users));
SELECT setval('customers_customer_id_seq', (SELECT MAX(customer_id) FROM Customers));
SELECT setval('customer_addresses_address_id_seq', (SELECT MAX(address_id) FROM Customer_Addresses));
SELECT setval('drivers_driver_id_seq', (SELECT MAX(driver_id) FROM Drivers));
SELECT setval('restaurants_restaurant_id_seq', (SELECT MAX(restaurant_id) FROM Restaurants));
SELECT setval('menu_categories_category_id_seq', (SELECT MAX(category_id) FROM Menu_Categories));
SELECT setval('menu_items_menu_item_id_seq', (SELECT MAX(menu_item_id) FROM Menu_Items));
SELECT setval('orders_order_id_seq', (SELECT MAX(order_id) FROM Orders));
SELECT setval('order_items_order_item_id_seq', (SELECT MAX(order_item_id) FROM Order_Items));
SELECT setval('delivery_assignments_assignment_id_seq', (SELECT MAX(assignment_id) FROM Delivery_Assignments));
SELECT setval('cart_items_cart_item_id_seq', (SELECT MAX(cart_item_id) FROM Cart_Items));

-- Done!
SELECT 'Sample data loaded successfully!' AS message;
