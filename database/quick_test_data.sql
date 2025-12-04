USE food_ordering_platform;

-- Create a test user (restaurant owner)
INSERT INTO Users (email, password_hash, role, phone, full_name) VALUES
('test.owner@email.com', '$2a$10$rZ8qS0YGXzJxJ0ZJ5jB7l.K5fY6Y3nZ8Z9vZ8Z9vZ8Z9vZ8Z9vZ8Z', 'restaurant_owner', '01234567890', 'Test Owner');

-- Get the user_id
SET @owner_id = LAST_INSERT_ID();

-- Create a test restaurant
INSERT INTO Restaurants (owner_id, name, slug, description, phone, street_address, city, delivery_fee, minimum_order, status) VALUES
(@owner_id, 'Test Restaurant', 'test-restaurant', 'A test restaurant', '01234567890', 'Test Street', 'Cairo', 10.00, 50.00, 'active');

-- Get restaurant_id
SET @restaurant_id = LAST_INSERT_ID();

-- Create menu category
INSERT INTO Menu_Categories (restaurant_id, name, display_order) VALUES
(@restaurant_id, 'Main Dishes', 1);

-- Get category_id
SET @category_id = LAST_INSERT_ID();

-- Create menu items
INSERT INTO Menu_Items (restaurant_id, category_id, name, slug, description, price, is_available) VALUES
(@restaurant_id, @category_id, 'Test Pizza', 'test-pizza', 'Delicious test pizza', 85.00, TRUE),
(@restaurant_id, @category_id, 'Test Burger', 'test-burger', 'Tasty test burger', 70.00, TRUE),
(@restaurant_id, @category_id, 'Test Pasta', 'test-pasta', 'Amazing test pasta', 60.00, TRUE);

SELECT 'Sample data created successfully!' as message;
SELECT * FROM Restaurants WHERE restaurant_id = @restaurant_id;
SELECT * FROM Menu_Items WHERE restaurant_id = @restaurant_id;
