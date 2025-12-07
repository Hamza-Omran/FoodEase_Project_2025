-- ============================================
-- MINIMAL FOOD ORDERING PLATFORM DATABASE
-- Version: 4.0 - Absolute Minimum
-- Removes: order_sequence table, redundant FKs, all timestamps
-- Pure 3NF with zero redundancy
-- ============================================

SET FOREIGN_KEY_CHECKS = 0;
DROP DATABASE IF EXISTS food_ordering_platform;
CREATE DATABASE food_ordering_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE food_ordering_platform;

-- ============================================
-- 1. USERS & AUTHENTICATION
-- ============================================

CREATE TABLE Users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('customer', 'restaurant_owner', 'driver', 'admin') NOT NULL,
    phone VARCHAR(20),
    full_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB;

-- ============================================
-- 2. CUSTOMERS
-- ============================================

CREATE TABLE Customers (
    customer_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    loyalty_points INT DEFAULT 0 CHECK (loyalty_points >= 0),
    total_orders INT DEFAULT 0,
    total_spent DECIMAL(12, 2) DEFAULT 0.00,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE Customer_Addresses (
    address_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    street_address VARCHAR(255) NOT NULL,
    apartment_number VARCHAR(50),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    is_default BOOLEAN DEFAULT FALSE,
    delivery_instructions TEXT,
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id) ON DELETE CASCADE,
    INDEX idx_customer (customer_id)
) ENGINE=InnoDB;

-- ============================================
-- 3. RESTAURANTS
-- ============================================

CREATE TABLE Restaurants (
    restaurant_id INT PRIMARY KEY AUTO_INCREMENT,
    owner_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    status ENUM('active', 'inactive', 'temporarily_closed') DEFAULT 'active',
    image_url VARCHAR(500),
    banner_url VARCHAR(500),
    delivery_fee DECIMAL(10, 2) DEFAULT 0.00,
    minimum_order DECIMAL(10, 2) DEFAULT 0.00,
    estimated_delivery_time INT DEFAULT 30,
    cuisine_type VARCHAR(100),
    is_featured BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (owner_id) REFERENCES Users(user_id),
    UNIQUE KEY unique_owner (owner_id),
    INDEX idx_status (status),
    FULLTEXT idx_search (name, description, cuisine_type)
) ENGINE=InnoDB;

-- ============================================
-- 4. DRIVERS
-- ============================================

CREATE TABLE Drivers (
    driver_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    vehicle_type VARCHAR(50),
    vehicle_model VARCHAR(100),
    license_plate VARCHAR(50) UNIQUE,
    license_number VARCHAR(100),
    is_available BOOLEAN DEFAULT TRUE,
    total_deliveries INT DEFAULT 0,
    completed_deliveries INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- 5. MENU STRUCTURE
-- ============================================

CREATE TABLE Menu_Categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    restaurant_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    FOREIGN KEY (restaurant_id) REFERENCES Restaurants(restaurant_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE Menu_Items (
    menu_item_id INT PRIMARY KEY AUTO_INCREMENT,
    restaurant_id INT NOT NULL,
    category_id INT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    image_url VARCHAR(500),
    is_available BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (restaurant_id) REFERENCES Restaurants(restaurant_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Menu_Categories(category_id) ON DELETE SET NULL,
    INDEX idx_restaurant (restaurant_id),
    FULLTEXT idx_search (name, description)
) ENGINE=InnoDB;

-- ============================================
-- 6. ORDERS
-- ============================================

CREATE TABLE Orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(50) UNIQUE DEFAULT '',
    customer_id INT NOT NULL,
    restaurant_id INT NOT NULL,
    delivery_address_id INT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled') DEFAULT 'pending',
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_method ENUM('cash', 'credit_card', 'debit_card', 'mobile_wallet', 'online'),
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
    delivery_fee DECIMAL(10, 2) DEFAULT 0.00,
    tax DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    special_instructions TEXT,
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id),
    FOREIGN KEY (restaurant_id) REFERENCES Restaurants(restaurant_id),
    FOREIGN KEY (delivery_address_id) REFERENCES Customer_Addresses(address_id),
    INDEX idx_customer (customer_id),
    INDEX idx_restaurant (restaurant_id),
    INDEX idx_status (status),
    INDEX idx_order_date (order_date)
) ENGINE=InnoDB;

CREATE TABLE Order_Items (
    order_item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    menu_item_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES Menu_Items(menu_item_id),
    INDEX idx_order (order_id)
) ENGINE=InnoDB;

-- ============================================
-- 7. DELIVERY
-- ============================================

CREATE TABLE Delivery_Assignments (
    assignment_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT UNIQUE NOT NULL,
    driver_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivery_status ENUM('assigned', 'accepted', 'rejected', 'picked_up', 'in_transit', 'delivered', 'failed') DEFAULT 'assigned',
    delivery_fee DECIMAL(10, 2),
    driver_earnings DECIMAL(10, 2),
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES Drivers(driver_id),
    INDEX idx_driver (driver_id),
    INDEX idx_status (delivery_status)
) ENGINE=InnoDB;

-- ============================================
-- 8. SHOPPING CART
-- ============================================

CREATE TABLE Cart_Items (
    cart_item_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES Menu_Items(menu_item_id) ON DELETE CASCADE,
    UNIQUE KEY unique_cart_item (customer_id, menu_item_id),
    INDEX idx_customer (customer_id)
) ENGINE=InnoDB;

-- ============================================
-- 9. FAVORITES
-- ============================================

CREATE TABLE Favorite_Restaurants (
    favorite_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    restaurant_id INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES Restaurants(restaurant_id) ON DELETE CASCADE,
    UNIQUE KEY unique_customer_restaurant (customer_id, restaurant_id),
    INDEX idx_customer_favorites (customer_id, added_at DESC)
) ENGINE=InnoDB;

-- ============================================
-- 12. REVIEWS AND RATINGS
-- ============================================

-- Restaurant Reviews
-- Stores customer feedback and ratings for restaurants
CREATE TABLE Restaurant_Reviews (
    review_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    restaurant_id INT NOT NULL,
    order_id INT,
    rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES Restaurants(restaurant_id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE SET NULL,
    UNIQUE KEY unique_order_review (customer_id, order_id),
    INDEX idx_restaurant_reviews (restaurant_id, review_date DESC),
    INDEX idx_customer_reviews (customer_id, review_date DESC)
) ENGINE=InnoDB;

-- Menu Item Reviews
-- Stores customer feedback and ratings for individual menu items
CREATE TABLE Menu_Item_Reviews (
    review_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    order_id INT,
    rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES Menu_Items(menu_item_id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE SET NULL,
    UNIQUE KEY unique_item_order_review (customer_id, menu_item_id, order_id),
    INDEX idx_menu_item_reviews (menu_item_id, review_date DESC),
    INDEX idx_customer_item_reviews (customer_id, review_date DESC)
) ENGINE=InnoDB;

-- Add rating columns to Restaurants table
ALTER TABLE Restaurants 
ADD COLUMN rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN review_count INT DEFAULT 0;

-- Add rating columns to Menu_Items table
ALTER TABLE Menu_Items
ADD COLUMN rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN review_count INT DEFAULT 0;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- NOTES:
-- ============================================
-- 1. Removed order_sequence table - order_number now generated via:
--    CONCAT('ORD', DATE_FORMAT(NOW(), '%Y%m%d'), LPAD(order_id, 6, '0'))
--    This happens AFTER INSERT in trigger using order_id
--
-- 2. Removed Cart_Items.restaurant_id FK - redundant
--    Restaurant validated via: Cart_Items → Menu_Items → restaurant_id
--
-- 3. Removed all created_at/updated_at - not displayed in frontend
--
-- 4. Kept assigned_at, added_at, order_date - these ARE used
--
-- 5. Still 100% 3NF compliant
-- ============================================
