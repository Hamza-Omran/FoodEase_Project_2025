-- ============================================
-- FOODEASE PLATFORM DATABASE - PostgreSQL Version
-- Converted from MySQL to PostgreSQL
-- For Supabase Deployment
-- Version: 1.0
-- ============================================

-- Note: Supabase already provides a database named 'postgres'
-- No need to create a new database or connect to it

-- ============================================
-- ENUM TYPE DEFINITIONS
-- PostgreSQL uses custom types instead of inline ENUM
-- ============================================

CREATE TYPE user_role AS ENUM ('customer', 'restaurant_owner', 'driver', 'admin');
CREATE TYPE restaurant_status AS ENUM ('active', 'inactive', 'temporarily_closed');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled');
CREATE TYPE payment_status_type AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE payment_method_type AS ENUM ('cash', 'credit_card', 'debit_card', 'mobile_wallet', 'online');
CREATE TYPE delivery_status_type AS ENUM ('assigned', 'accepted', 'rejected', 'picked_up', 'in_transit', 'delivered', 'failed');

-- ============================================
-- 1. USERS & AUTHENTICATION
-- ============================================

CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    phone VARCHAR(20),
    full_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_users_email ON Users(email);
CREATE INDEX idx_users_role ON Users(role);

-- ============================================
-- 2. CUSTOMERS
-- ============================================

CREATE TABLE Customers (
    customer_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    loyalty_points INTEGER DEFAULT 0 CHECK (loyalty_points >= 0),
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(12, 2) DEFAULT 0.00,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE Customer_Addresses (
    address_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    street_address VARCHAR(255) NOT NULL,
    apartment_number VARCHAR(50),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    is_default BOOLEAN DEFAULT FALSE,
    delivery_instructions TEXT,
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id) ON DELETE CASCADE
);

CREATE INDEX idx_customer_addresses_customer ON Customer_Addresses(customer_id);

-- ============================================
-- 3. RESTAURANTS
-- ============================================

CREATE TABLE Restaurants (
    restaurant_id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    status restaurant_status DEFAULT 'active',
    image_url VARCHAR(500),
    banner_url VARCHAR(500),
    delivery_fee DECIMAL(10, 2) DEFAULT 0.00,
    minimum_order DECIMAL(10, 2) DEFAULT 0.00,
    estimated_delivery_time INTEGER DEFAULT 30,
    cuisine_type VARCHAR(100),
    is_featured BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    FOREIGN KEY (owner_id) REFERENCES Users(user_id),
    CONSTRAINT unique_owner UNIQUE (owner_id)
);

CREATE INDEX idx_restaurants_status ON Restaurants(status);

-- PostgreSQL full-text search using GIN index
CREATE INDEX idx_restaurants_search ON Restaurants USING GIN (
    to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(cuisine_type, ''))
);

-- ============================================
-- 4. DRIVERS
-- ============================================

CREATE TABLE Drivers (
    driver_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    vehicle_type VARCHAR(50),
    vehicle_model VARCHAR(100),
    license_plate VARCHAR(50) UNIQUE,
    license_number VARCHAR(100),
    is_available BOOLEAN DEFAULT TRUE,
    total_deliveries INTEGER DEFAULT 0,
    completed_deliveries INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- ============================================
-- 5. MENU STRUCTURE
-- ============================================

CREATE TABLE Menu_Categories (
    category_id SERIAL PRIMARY KEY,
    restaurant_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    FOREIGN KEY (restaurant_id) REFERENCES Restaurants(restaurant_id) ON DELETE CASCADE
);

CREATE TABLE Menu_Items (
    menu_item_id SERIAL PRIMARY KEY,
    restaurant_id INTEGER NOT NULL,
    category_id INTEGER,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    image_url VARCHAR(500),
    is_available BOOLEAN DEFAULT TRUE,
    rating DECIMAL(3,2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    FOREIGN KEY (restaurant_id) REFERENCES Restaurants(restaurant_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Menu_Categories(category_id) ON DELETE SET NULL
);

CREATE INDEX idx_menu_items_restaurant ON Menu_Items(restaurant_id);

-- Full-text search for menu items
CREATE INDEX idx_menu_items_search ON Menu_Items USING GIN (
    to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, ''))
);

-- ============================================
-- 6. ORDERS
-- ============================================

CREATE TABLE Orders (
    order_id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE DEFAULT '',
    customer_id INTEGER NOT NULL,
    restaurant_id INTEGER NOT NULL,
    delivery_address_id INTEGER NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status order_status DEFAULT 'pending',
    payment_status payment_status_type DEFAULT 'pending',
    payment_method payment_method_type,
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
    delivery_fee DECIMAL(10, 2) DEFAULT 0.00,
    tax DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    special_instructions TEXT,
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id),
    FOREIGN KEY (restaurant_id) REFERENCES Restaurants(restaurant_id),
    FOREIGN KEY (delivery_address_id) REFERENCES Customer_Addresses(address_id)
);

CREATE INDEX idx_orders_customer ON Orders(customer_id);
CREATE INDEX idx_orders_restaurant ON Orders(restaurant_id);
CREATE INDEX idx_orders_status ON Orders(status);
CREATE INDEX idx_orders_date ON Orders(order_date);

CREATE TABLE Order_Items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    menu_item_id INTEGER NOT NULL,
    menu_item_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES Menu_Items(menu_item_id)
);

CREATE INDEX idx_order_items_order ON Order_Items(order_id);

-- ============================================
-- 7. DELIVERY
-- ============================================

CREATE TABLE Delivery_Assignments (
    assignment_id SERIAL PRIMARY KEY,
    order_id INTEGER UNIQUE NOT NULL,
    driver_id INTEGER NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivery_status delivery_status_type DEFAULT 'assigned',
    delivery_fee DECIMAL(10, 2),
    driver_earnings DECIMAL(10, 2),
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES Drivers(driver_id)
);

CREATE INDEX idx_delivery_assignments_driver ON Delivery_Assignments(driver_id);
CREATE INDEX idx_delivery_assignments_status ON Delivery_Assignments(delivery_status);

-- ============================================
-- 8. SHOPPING CART
-- ============================================

CREATE TABLE Cart_Items (
    cart_item_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    menu_item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES Menu_Items(menu_item_id) ON DELETE CASCADE,
    CONSTRAINT unique_cart_item UNIQUE (customer_id, menu_item_id)
);

CREATE INDEX idx_cart_items_customer ON Cart_Items(customer_id);

-- ============================================
-- 9. FAVORITES
-- ============================================

CREATE TABLE Favorite_Restaurants (
    favorite_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    restaurant_id INTEGER NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES Restaurants(restaurant_id) ON DELETE CASCADE,
    CONSTRAINT unique_customer_restaurant UNIQUE (customer_id, restaurant_id)
);

CREATE INDEX idx_favorite_restaurants_customer ON Favorite_Restaurants(customer_id, added_at DESC);

-- ============================================
-- 10. REVIEWS AND RATINGS
-- ============================================

CREATE TABLE Restaurant_Reviews (
    review_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    restaurant_id INTEGER NOT NULL,
    order_id INTEGER,
    rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES Restaurants(restaurant_id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE SET NULL,
    CONSTRAINT unique_order_review UNIQUE (customer_id, order_id)
);

CREATE INDEX idx_restaurant_reviews_restaurant ON Restaurant_Reviews(restaurant_id, review_date DESC);
CREATE INDEX idx_restaurant_reviews_customer ON Restaurant_Reviews(customer_id, review_date DESC);

CREATE TABLE Menu_Item_Reviews (
    review_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    menu_item_id INTEGER NOT NULL,
    order_id INTEGER,
    rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES Menu_Items(menu_item_id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE SET NULL,
    CONSTRAINT unique_item_order_review UNIQUE (customer_id, menu_item_id, order_id)
);

CREATE INDEX idx_menu_item_reviews_item ON Menu_Item_Reviews(menu_item_id, review_date DESC);
CREATE INDEX idx_menu_item_reviews_customer ON Menu_Item_Reviews(customer_id, review_date DESC);

-- ============================================
-- NOTES
-- ============================================
-- Converted from MySQL with the following changes:
-- 1. AUTO_INCREMENT → SERIAL
-- 2. ENUM inline → CREATE TYPE definitions
-- 3. TINYINT → SMALLINT
-- 4. ENGINE=InnoDB → removed (not needed in PostgreSQL)
-- 5. INDEX syntax → CREATE INDEX statements
-- 6. FULLTEXT → GIN indexes with to_tsvector
-- 7. UNIQUE KEY → CONSTRAINT
-- ============================================
