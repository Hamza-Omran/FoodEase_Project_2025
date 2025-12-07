USE food_ordering_platform;

SET FOREIGN_KEY_CHECKS = 0;

-- Clear existing data (only existing tables)
TRUNCATE TABLE Delivery_Assignments;
TRUNCATE TABLE Order_Items;
TRUNCATE TABLE Orders;
TRUNCATE TABLE Cart_Items;
TRUNCATE TABLE Menu_Items;
TRUNCATE TABLE Menu_Categories;
TRUNCATE TABLE Favorite_Restaurants;
TRUNCATE TABLE Customer_Addresses;
TRUNCATE TABLE Customers;
TRUNCATE TABLE Drivers;
TRUNCATE TABLE Restaurants;
TRUNCATE TABLE Users;

SET FOREIGN_KEY_CHECKS = 1;

-- Use variables to hold generated IDs
SET @admin_user_id := NULL;
SET @owner_user_id := NULL;
SET @owner2_user_id := NULL;
SET @owner3_user_id := NULL;
SET @owner4_user_id := NULL;
SET @customer_user_id := NULL;
SET @driver_user_id := NULL;

SET @customer_id := NULL;
SET @driver_id := NULL;

SET @rest1_id := NULL;
SET @rest2_id := NULL;
SET @rest3_id := NULL;
SET @rest4_id := NULL;

SET @addr1_id := NULL;
SET @addr2_id := NULL;

SET @cat1_id := NULL;
SET @cat2_id := NULL;
SET @cat3_id := NULL;
SET @cat4_id := NULL;
SET @cat5_id := NULL;
SET @cat6_id := NULL;

SET @mi1_id := NULL;
SET @mi2_id := NULL;
SET @mi3_id := NULL;
SET @mi4_id := NULL;
SET @mi5_id := NULL;

-- ============================================
-- USERS (removed email_verified column)
-- ============================================

INSERT INTO Users (email, password_hash, role, phone, full_name, is_active)
VALUES
  ('admin@foodease.local',
   '$2b$10$afJGWoyUnnZ6V94PqoozYucP/MDgCesGNo7/E1wYTk2/UUkN1BSjC',
   'admin', '01000000001', 'Admin User', 1),
  ('owner@foodease.local',
   '$2b$10$afJGWoyUnnZ6V94PqoozYucP/MDgCesGNo7/E1wYTk2/UUkN1BSjC',
   'restaurant_owner', '01000000002', 'Pizza Palace Owner', 1),
  ('owner2@foodease.local',
   '$2b$10$afJGWoyUnnZ6V94PqoozYucP/MDgCesGNo7/E1wYTk2/UUkN1BSjC',
   'restaurant_owner', '01000000005', 'Sushi House Owner', 1),
  ('owner3@foodease.local',
   '$2b$10$afJGWoyUnnZ6V94PqoozYucP/MDgCesGNo7/E1wYTk2/UUkN1BSjC',
   'restaurant_owner', '01000000006', 'Burger Hub Owner', 1),
  ('owner4@foodease.local',
   '$2b$10$afJGWoyUnnZ6V94PqoozYucP/MDgCesGNo7/E1wYTk2/UUkN1BSjC',
   'restaurant_owner', '01000000007', 'Healthy Bites Owner', 1),
  ('customer@foodease.local',
   '$2b$10$afJGWoyUnnZ6V94PqoozYucP/MDgCesGNo7/E1wYTk2/UUkN1BSjC',
   'customer', '01000000003', 'Test Customer', 1),
  ('driver@foodease.local',
   '$2b$10$afJGWoyUnnZ6V94PqoozYucP/MDgCesGNo7/E1wYTk2/UUkN1BSjC',
   'driver', '01000000004', 'Test Driver', 1);

-- Capture IDs
SELECT user_id INTO @admin_user_id FROM Users WHERE email='admin@foodease.local';
SELECT user_id INTO @owner_user_id FROM Users WHERE email='owner@foodease.local';
SELECT user_id INTO @owner2_user_id FROM Users WHERE email='owner2@foodease.local';
SELECT user_id INTO @owner3_user_id FROM Users WHERE email='owner3@foodease.local';
SELECT user_id INTO @owner4_user_id FROM Users WHERE email='owner4@foodease.local';
SELECT user_id INTO @customer_user_id FROM Users WHERE email='customer@foodease.local';
SELECT user_id INTO @driver_user_id FROM Users WHERE email='driver@foodease.local';

SELECT customer_id INTO @customer_id FROM Customers WHERE user_id = @customer_user_id;

-- Update customer stats
UPDATE Customers
SET loyalty_points = 25,
    total_orders = 2,
    total_spent = 350.00
WHERE customer_id = @customer_id;

-- ============================================
-- ADDRESSES (removed deleted columns)
-- ============================================

INSERT INTO Customer_Addresses (
  customer_id, street_address, apartment_number,
  city, state, is_default, delivery_instructions
) VALUES
  (@customer_id, '123 Nile St', 'Apt 4B', 'Cairo', 'Cairo', 1, 'Ring the bell'),
  (@customer_id, '456 Tahrir', NULL, 'Cairo', 'Cairo', 0, 'Call on arrival');

SELECT MIN(address_id) INTO @addr1_id FROM Customer_Addresses WHERE customer_id = @customer_id AND is_default=1;
SELECT MIN(address_id) INTO @addr2_id FROM Customer_Addresses WHERE customer_id = @customer_id AND is_default=0;

-- ============================================
-- DRIVERS (removed deleted columns)
-- ============================================

INSERT INTO Drivers (
  user_id, vehicle_type, vehicle_model, license_plate,
  license_number, is_available,
  total_deliveries, completed_deliveries
) VALUES
  (@driver_user_id, 'bike', 'Honda', 'CAIRO-123', 'LIC-123', 1, 10, 9);

SELECT driver_id INTO @driver_id FROM Drivers WHERE user_id = @driver_user_id;

-- ============================================
-- RESTAURANTS (removed deleted columns)
-- ============================================

INSERT INTO Restaurants (
  owner_id, name, description, phone, email,
  street_address, city, status,
  image_url, banner_url,
  delivery_fee, minimum_order, estimated_delivery_time,
  cuisine_type, is_featured
) VALUES
  (@owner_user_id, 'Pizza Palace',
   'Authentic Italian pizza with fresh ingredients.',
   '01111111111', 'pizza@palace.eg',
   '12 Main St', 'Cairo', 'active',
   '/uploads/restaurants/download.jpeg', '/uploads/restaurants/download.jpeg',
   20.00, 50.00, 30, 'Italian', 1),
  (@owner2_user_id, 'Sushi House',
   'Fresh sushi and Japanese cuisine.',
   '01111111112', 'sushi@house.eg',
   '34 Sea Rd', 'Alexandria', 'active',
   '/uploads/restaurants/download%20(1).jpeg', '/uploads/restaurants/download%20(1).jpeg',
   25.00, 50.00, 40, 'Japanese', 1),
  (@owner3_user_id, 'Burger Hub',
   'Juicy burgers and fries.',
   '01111111113', 'burger@hub.eg',
   '56 Nile St', 'Giza', 'active',
   '/uploads/restaurants/download%20(2).jpeg', '/uploads/restaurants/download%20(2).jpeg',
   15.00, 50.00, 35, 'American', 0),
  (@owner4_user_id, 'Healthy Bites',
   'Healthy salads and pasta.',
   '01111111114', 'healthy@bites.eg',
   '89 Green Rd', 'Cairo', 'active',
   '/uploads/restaurants/download%20(3).jpeg', '/uploads/restaurants/download%20(3).jpeg',
   18.00, 50.00, 25, 'Healthy', 1);

SELECT restaurant_id INTO @rest1_id FROM Restaurants WHERE name='Pizza Palace';
SELECT restaurant_id INTO @rest2_id FROM Restaurants WHERE name='Sushi House';
SELECT restaurant_id INTO @rest3_id FROM Restaurants WHERE name='Burger Hub';
SELECT restaurant_id INTO @rest4_id FROM Restaurants WHERE name='Healthy Bites';

-- ============================================
-- MENU CATEGORIES (removed display_order, is_active)
-- ============================================

INSERT INTO Menu_Categories (restaurant_id, name, description)
VALUES
  (@rest1_id, 'Pizzas', 'Classic and specialty pizzas'),
  (@rest1_id, 'Sides', 'Starters and sides'),
  (@rest2_id, 'Sushi Rolls', 'Signature sushi rolls'),
  (@rest2_id, 'Nigiri & Sashimi', 'Fresh fish on rice'),
  (@rest3_id, 'Burgers', 'Juicy burgers'),
  (@rest4_id, 'Pasta', 'Italian pasta dishes');

SELECT category_id INTO @cat1_id FROM Menu_Categories WHERE restaurant_id=@rest1_id AND name='Pizzas';
SELECT category_id INTO @cat2_id FROM Menu_Categories WHERE restaurant_id=@rest1_id AND name='Sides';
SELECT category_id INTO @cat3_id FROM Menu_Categories WHERE restaurant_id=@rest2_id AND name='Sushi Rolls';
SELECT category_id INTO @cat4_id FROM Menu_Categories WHERE restaurant_id=@rest2_id AND name='Nigiri & Sashimi';
SELECT category_id INTO @cat5_id FROM Menu_Categories WHERE restaurant_id=@rest3_id AND name='Burgers';
SELECT category_id INTO @cat6_id FROM Menu_Categories WHERE restaurant_id=@rest4_id AND name='Pasta';

-- ============================================
-- MENU ITEMS (removed all deleted columns)
-- ============================================

INSERT INTO Menu_Items (
  restaurant_id, category_id, name, description, price,
  image_url, is_available
) VALUES
  (@rest1_id, @cat1_id, 'Margherita Pizza',
   'Tomato sauce, mozzarella, fresh basil.', 89.99,
   '/uploads/menu-items/pizza.jpeg', 1),
  (@rest1_id, @cat1_id, 'Pepperoni Pizza',
   'Tomato sauce, mozzarella, spicy pepperoni.', 109.99,
   '/uploads/menu-items/pizza2.jpeg', 1),
  (@rest1_id, @cat2_id, 'Garlic Bread',
   'Freshly baked bread with garlic butter.', 39.99,
   '/uploads/menu-items/pizza3.jpeg', 1),
  (@rest2_id, @cat3_id, 'California Roll',
   'Crab, avocado, cucumber.', 120.00,
   '/uploads/menu-items/sushi.jpeg', 1),
  (@rest2_id, @cat3_id, 'Spicy Tuna Roll',
   'Fresh tuna with spicy mayo.', 140.00,
   '/uploads/menu-items/sushi2.jpeg', 1),
  (@rest2_id, @cat4_id, 'Salmon Nigiri',
   'Fresh salmon on rice.', 80.00,
   '/uploads/menu-items/shushi.jpeg', 1),
  (@rest3_id, @cat5_id, 'Classic Burger',
   'Juicy beef patty with fresh toppings.', 79.99,
   '/uploads/menu-items/burger.jpeg', 1),
  (@rest3_id, @cat5_id, 'Cheese Burger',
   'Double cheese with special sauce.', 89.99,
   '/uploads/menu-items/burger2.jpeg', 1),
  (@rest3_id, @cat5_id, 'Mega Burger',
   'Triple patty with bacon and cheese.', 119.99,
   '/uploads/menu-items/burger3.jpeg', 1),
  (@rest4_id, @cat6_id, 'Spaghetti Carbonara',
   'Classic Italian pasta with creamy sauce.', 95.00,
   '/uploads/menu-items/spaghetti.jpeg', 1),
  (@rest4_id, @cat6_id, 'Spaghetti Bolognese',
   'Rich meat sauce with Italian herbs.', 99.00,
   '/uploads/menu-items/spaghetti2.jpeg', 1),
  (@rest4_id, @cat6_id, 'Spaghetti Marinara',
   'Fresh seafood with tomato sauce.', 115.00,
   '/uploads/menu-items/spaghetti3.jpeg', 1),
  (@rest4_id, @cat6_id, 'Pasta Primavera',
   'Vegetable pasta with olive oil.', 89.00,
   '/uploads/menu-items/spaghetti4.jpeg', 1);

-- Capture menu item IDs
SELECT menu_item_id INTO @mi1_id FROM Menu_Items WHERE name='Margherita Pizza' AND restaurant_id=@rest1_id LIMIT 1;
SELECT menu_item_id INTO @mi2_id FROM Menu_Items WHERE name='Pepperoni Pizza' AND restaurant_id=@rest1_id LIMIT 1;
SELECT menu_item_id INTO @mi3_id FROM Menu_Items WHERE name='Garlic Bread' AND restaurant_id=@rest1_id LIMIT 1;
SELECT menu_item_id INTO @mi4_id FROM Menu_Items WHERE name='California Roll' AND restaurant_id=@rest2_id LIMIT 1;
SELECT menu_item_id INTO @mi5_id FROM Menu_Items WHERE name='Spicy Tuna Roll' AND restaurant_id=@rest2_id LIMIT 1;

-- ============================================
-- SAMPLE CART (removed restaurant_id column)
-- ============================================

DELETE FROM Cart_Items WHERE customer_id = @customer_id;

INSERT INTO Cart_Items (customer_id, menu_item_id, quantity)
VALUES
  (@customer_id, @mi1_id, 1),
  (@customer_id, @mi2_id, 1);

-- ============================================
-- SAMPLE ORDER
-- ============================================

CALL sp_place_order(@customer_id, @rest1_id, @addr1_id, 'Please add extra cheese.', 'cash', NULL);

SELECT order_id INTO @order1_id FROM Orders WHERE customer_id = @customer_id ORDER BY order_date DESC LIMIT 1;

INSERT INTO Delivery_Assignments (
  order_id, driver_id, delivery_status, delivery_fee, driver_earnings
) VALUES (
  @order1_id, @driver_id, 'assigned', 20.00, 14.00
);

-- Done!
SELECT 'Sample data loaded successfully!' AS message;
