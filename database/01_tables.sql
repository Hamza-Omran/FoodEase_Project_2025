-- ============================================
-- PROFESSIONAL FOOD ORDERING PLATFORM DATABASE
-- Version: 1.0
-- Normalized to 3NF
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
    role ENUM('customer', 'restaurant_owner', 'employee', 'driver', 'admin') NOT NULL,
    phone VARCHAR(20),
    full_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_active (is_active)
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
    preferred_payment_method ENUM('cash', 'credit_card', 'debit_card', 'mobile_wallet', 'online'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    INDEX idx_loyalty (loyalty_points)
) ENGINE=InnoDB;

-- NOTE:
--  - Customers table intentionally does NOT have 'full_name'.
--  - Name is stored on Users.full_name and should be JOINed when needed.

CREATE TABLE Customer_Addresses (
    address_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    address_label VARCHAR(50) DEFAULT 'Home',
    street_address VARCHAR(255) NOT NULL,
    apartment_number VARCHAR(50),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Egypt',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_default BOOLEAN DEFAULT FALSE,
    delivery_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id) ON DELETE CASCADE,
    INDEX idx_customer (customer_id),
    INDEX idx_default (customer_id, is_default)
) ENGINE=InnoDB;

-- ============================================
-- 3. RESTAURANTS
-- ============================================

CREATE TABLE Restaurants (
    restaurant_id INT PRIMARY KEY AUTO_INCREMENT,
    owner_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    opening_time TIME,
    closing_time TIME,
    status ENUM('active', 'inactive', 'temporarily_closed') DEFAULT 'active',
    rating DECIMAL(3, 2) DEFAULT 0.00 CHECK (rating BETWEEN 0 AND 5),
    total_reviews INT DEFAULT 0,
    image_url VARCHAR(500),
    banner_url VARCHAR(500),
    delivery_fee DECIMAL(10, 2) DEFAULT 0.00,
    minimum_order DECIMAL(10, 2) DEFAULT 0.00,
    estimated_delivery_time INT DEFAULT 30, -- minutes
    cuisine_type VARCHAR(100),
    is_featured BOOLEAN DEFAULT FALSE,
    commission_rate DECIMAL(5, 2) DEFAULT 15.00, -- platform commission %
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES Users(user_id),
    UNIQUE KEY unique_owner (owner_id),  -- ✅ Each owner can have only ONE restaurant
    INDEX idx_status (status),
    INDEX idx_city (city),
    INDEX idx_rating (rating),
    INDEX idx_featured (is_featured),
    FULLTEXT idx_search (name, description, cuisine_type)
) ENGINE=InnoDB;

-- ============================================
-- 4. EMPLOYEES
-- ============================================

CREATE TABLE Employees (
    employee_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    restaurant_id INT NOT NULL,
    position VARCHAR(100) DEFAULT 'staff',
    hire_date DATE,
    salary DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES Restaurants(restaurant_id) ON DELETE CASCADE,
    INDEX idx_restaurant (restaurant_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- ============================================
-- 5. DRIVERS
-- ============================================

CREATE TABLE Drivers (
    driver_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    vehicle_type VARCHAR(50),
    vehicle_model VARCHAR(100),
    license_plate VARCHAR(50) UNIQUE,
    license_number VARCHAR(100),
    is_available BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    current_latitude DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    rating DECIMAL(3, 2) DEFAULT 0.00 CHECK (rating BETWEEN 0 AND 5),
    total_deliveries INT DEFAULT 0,
    completed_deliveries INT DEFAULT 0,
    cancelled_deliveries INT DEFAULT 0,
    earnings_total DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    INDEX idx_available (is_available),
    INDEX idx_location (current_latitude, current_longitude)
) ENGINE=InnoDB;

-- ============================================
-- 6. MENU STRUCTURE
-- ============================================

CREATE TABLE Menu_Categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    restaurant_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES Restaurants(restaurant_id) ON DELETE CASCADE,
    INDEX idx_restaurant (restaurant_id),
    INDEX idx_display (restaurant_id, display_order)
) ENGINE=InnoDB;

CREATE TABLE Menu_Items (
    menu_item_id INT PRIMARY KEY AUTO_INCREMENT,
    restaurant_id INT NOT NULL,
    category_id INT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    discount_price DECIMAL(10, 2) CHECK (discount_price >= 0),
    image_url VARCHAR(500),
    is_available BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    preparation_time INT DEFAULT 15, -- minutes
    is_vegetarian BOOLEAN DEFAULT FALSE,
    is_vegan BOOLEAN DEFAULT FALSE,
    is_spicy BOOLEAN DEFAULT FALSE,
    spice_level ENUM('mild', 'medium', 'hot', 'extra_hot'),
    calories INT,
    allergens VARCHAR(255), -- comma-separated
    rating DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    total_orders INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES Restaurants(restaurant_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Menu_Categories(category_id) ON DELETE SET NULL,
    UNIQUE KEY unique_slug (restaurant_id, slug),
    INDEX idx_restaurant (restaurant_id),
    INDEX idx_category (category_id),
    INDEX idx_available (is_available),
    INDEX idx_featured (is_featured),
    FULLTEXT idx_search (name, description)
) ENGINE=InnoDB;

CREATE TABLE Menu_Item_Inventory (
    inventory_id INT PRIMARY KEY AUTO_INCREMENT,
    menu_item_id INT UNIQUE NOT NULL,
    stock_quantity INT DEFAULT 0 CHECK (stock_quantity >= 0),
    low_stock_threshold INT DEFAULT 10,
    last_restocked_at TIMESTAMP NULL,
    last_restocked_quantity INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (menu_item_id) REFERENCES Menu_Items(menu_item_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- 7. ORDERS
-- ============================================

CREATE TABLE Orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT NOT NULL,
    restaurant_id INT NOT NULL,
    delivery_address_id INT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled') DEFAULT 'pending',
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
    delivery_fee DECIMAL(10, 2) DEFAULT 0.00,
    tax DECIMAL(10, 2) DEFAULT 0.00,
    discount DECIMAL(10, 2) DEFAULT 0.00,
    loyalty_points_used INT DEFAULT 0,
    loyalty_discount DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    special_instructions TEXT,
    estimated_prep_time INT, -- minutes
    estimated_delivery_time TIMESTAMP,
    actual_delivery_time TIMESTAMP,
    confirmed_at TIMESTAMP NULL,
    preparing_at TIMESTAMP NULL,
    ready_at TIMESTAMP NULL,
    out_for_delivery_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    cancellation_reason TEXT,
    cancelled_by INT, -- user_id
    rating INT CHECK (rating BETWEEN 1 AND 5),
    review_comment TEXT,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id),
    FOREIGN KEY (restaurant_id) REFERENCES Restaurants(restaurant_id),
    FOREIGN KEY (delivery_address_id) REFERENCES Customer_Addresses(address_id),
    FOREIGN KEY (cancelled_by) REFERENCES Users(user_id) ON DELETE SET NULL,
    INDEX idx_order_number (order_number),
    INDEX idx_customer (customer_id),
    INDEX idx_restaurant (restaurant_id),
    INDEX idx_status (status),
    INDEX idx_payment_status (payment_status),
    INDEX idx_order_date (order_date),
    INDEX idx_restaurant_date (restaurant_id, order_date)
) ENGINE=InnoDB;

CREATE TABLE Order_Items (
    order_item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    menu_item_name VARCHAR(255) NOT NULL, -- snapshot
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES Menu_Items(menu_item_id),
    INDEX idx_order (order_id),
    INDEX idx_menu_item (menu_item_id)
) ENGINE=InnoDB;

CREATE TABLE Order_Status_History (
    history_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by INT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    ip_address VARCHAR(45),
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES Users(user_id) ON DELETE SET NULL,
    INDEX idx_order (order_id),
    INDEX idx_changed_at (changed_at)
) ENGINE=InnoDB;

-- ============================================
-- 8. DELIVERY
-- ============================================

CREATE TABLE Delivery_Assignments (
    assignment_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT UNIQUE NOT NULL,
    driver_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP NULL,
    pickup_time TIMESTAMP NULL,
    delivery_time TIMESTAMP NULL,
    delivery_status ENUM('assigned', 'accepted', 'rejected', 'picked_up', 'in_transit', 'delivered', 'failed') DEFAULT 'assigned',
    pickup_latitude DECIMAL(10, 8),
    pickup_longitude DECIMAL(11, 8),
    delivery_latitude DECIMAL(10, 8),
    delivery_longitude DECIMAL(11, 8),
    current_latitude DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    distance_km DECIMAL(6, 2),
    delivery_fee DECIMAL(10, 2),
    driver_earnings DECIMAL(10, 2),
    rejection_reason TEXT,
    failure_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES Drivers(driver_id),
    INDEX idx_driver (driver_id),
    INDEX idx_status (delivery_status),
    INDEX idx_assigned_at (assigned_at)
) ENGINE=InnoDB;

-- ============================================
-- 9. PAYMENTS
-- ============================================

CREATE TABLE Payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT UNIQUE NOT NULL,
    payment_method ENUM('cash', 'credit_card', 'debit_card', 'mobile_wallet', 'online') NOT NULL,
    payment_status ENUM('pending', 'processing', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    amount DECIMAL(10, 2) NOT NULL,
    transaction_id VARCHAR(255) UNIQUE,
    payment_gateway VARCHAR(100),
    gateway_response TEXT,
    paid_at TIMESTAMP NULL,
    refund_amount DECIMAL(10, 2) DEFAULT 0.00,
    refunded_at TIMESTAMP NULL,
    refund_reason TEXT,
    failure_reason TEXT,
    retry_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    INDEX idx_status (payment_status),
    INDEX idx_transaction (transaction_id),
    INDEX idx_method (payment_method),
    INDEX idx_paid_at (paid_at)
) ENGINE=InnoDB;

-- ============================================
-- 10. REVIEWS & RATINGS
-- ============================================

CREATE TABLE Reviews (
    review_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    customer_id INT NOT NULL,
    restaurant_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    food_rating INT CHECK (food_rating BETWEEN 1 AND 5),
    delivery_rating INT CHECK (delivery_rating BETWEEN 1 AND 5),
    comment TEXT,
    is_verified_purchase BOOLEAN DEFAULT TRUE,
    is_visible BOOLEAN DEFAULT TRUE,
    helpful_count INT DEFAULT 0,
    reported_count INT DEFAULT 0,
    restaurant_response TEXT,
    responded_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id),
    FOREIGN KEY (restaurant_id) REFERENCES Restaurants(restaurant_id) ON DELETE CASCADE,
    UNIQUE KEY unique_order_review (order_id),
    INDEX idx_restaurant (restaurant_id),
    INDEX idx_customer (customer_id),
    INDEX idx_rating (rating),
    INDEX idx_visible (is_visible)
) ENGINE=InnoDB;

CREATE TABLE Menu_Item_Reviews (
    item_review_id INT PRIMARY KEY AUTO_INCREMENT,
    order_item_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    customer_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_item_id) REFERENCES Order_Items(order_item_id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES Menu_Items(menu_item_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id),
    UNIQUE KEY unique_item_review (order_item_id, menu_item_id),
    INDEX idx_menu_item (menu_item_id),
    INDEX idx_customer (customer_id)
) ENGINE=InnoDB;

-- ============================================
-- 11. SHOPPING CART
-- ============================================

CREATE TABLE Cart_Items (
    cart_item_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    restaurant_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    special_requests TEXT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES Restaurants(restaurant_id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES Menu_Items(menu_item_id) ON DELETE CASCADE,
    UNIQUE KEY unique_cart_item (customer_id, menu_item_id),
    INDEX idx_customer (customer_id),
    INDEX idx_restaurant (customer_id, restaurant_id)
) ENGINE=InnoDB;

-- ============================================
-- 12. NOTIFICATIONS
-- ============================================

CREATE TABLE Notifications (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type ENUM('order_update', 'delivery_update', 'promotion', 'review_request', 'system') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSON,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_read (user_id, is_read),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ============================================
-- 13. COUPONS & PROMOTIONS
-- ============================================

CREATE TABLE Coupons (
    coupon_id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type ENUM('percentage', 'fixed_amount') NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(10, 2) DEFAULT 0.00,
    max_discount_amount DECIMAL(10, 2),
    usage_limit INT,
    usage_count INT DEFAULT 0,
    per_user_limit INT DEFAULT 1,
    applicable_to ENUM('all', 'restaurant', 'category', 'item'),
    restaurant_id INT,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES Restaurants(restaurant_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES Users(user_id) ON DELETE SET NULL,
    INDEX idx_code (code),
    INDEX idx_active (is_active),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB;

CREATE TABLE Coupon_Usage (
    usage_id INT PRIMARY KEY AUTO_INCREMENT,
    coupon_id INT NOT NULL,
    customer_id INT NOT NULL,
    order_id INT NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coupon_id) REFERENCES Coupons(coupon_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id),
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    INDEX idx_coupon (coupon_id),
    INDEX idx_customer (customer_id)
) ENGINE=InnoDB;

-- ============================================
-- 14. FAVORITES & WISHLIST
-- ============================================

CREATE TABLE Favorite_Restaurants (
    favorite_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    restaurant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES Restaurants(restaurant_id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorite (customer_id, restaurant_id),
    INDEX idx_customer (customer_id)
) ENGINE=InnoDB;

-- ============================================
-- 15. SYSTEM LOGS & AUDIT
-- ============================================

CREATE TABLE Activity_Logs (
    log_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- SEQUENCE TABLE FOR ORDER NUMBERS
-- ============================================

CREATE TABLE order_sequence (
    seq_id INT AUTO_INCREMENT PRIMARY KEY
) ENGINE=InnoDB;
