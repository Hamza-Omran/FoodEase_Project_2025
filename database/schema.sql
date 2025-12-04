-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Dec 01, 2025 at 09:38 PM
-- Server version: 11.8.3-MariaDB-log
-- PHP Version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u595508539_food_order`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`u595508539_root3`@`127.0.0.1` PROCEDURE `sp_add_review` (IN `p_order_id` INT, IN `p_rating` INT, IN `p_comment` TEXT, IN `p_food_rating` INT, IN `p_delivery_rating` INT)   BEGIN
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
    
    SELECT COUNT(*) > 0 INTO v_already_reviewed
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

CREATE DEFINER=`u595508539_root3`@`127.0.0.1` PROCEDURE `sp_assign_driver` (IN `p_order_id` INT, IN `p_driver_id` INT)   BEGIN
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

CREATE DEFINER=`u595508539_root3`@`127.0.0.1` PROCEDURE `sp_generate_sales_report` (IN `p_restaurant_id` INT, IN `p_start_date` DATE, IN `p_end_date` DATE)   BEGIN
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

CREATE DEFINER=`u595508539_root3`@`127.0.0.1` PROCEDURE `sp_get_available_drivers` (IN `p_restaurant_id` INT, IN `p_radius_km` DECIMAL(6,2))   BEGIN
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

CREATE DEFINER=`u595508539_root3`@`127.0.0.1` PROCEDURE `sp_get_order_tracking` (IN `p_order_id` INT)   BEGIN
    SELECT 
        o.order_id,
        o.order_number,
        o.status,
        o.estimated_delivery_time,
        o.actual_delivery_time,
        r.name as restaurant_name,
        r.phone as restaurant_phone,
        ca.street_address as delivery_address,
        CONCAT(u.full_name, ' - ', d.vehicle_model) as driver_info,
        d.phone as driver_phone,
        da.delivery_status,
        da.current_latitude,
        da.current_longitude,
        TIMESTAMPDIFF(MINUTE, o.order_date, NOW()) as minutes_since_order
    FROM Orders o
    JOIN Restaurants r ON o.restaurant_id = r.restaurant_id
    JOIN Customer_Addresses ca ON o.delivery_address_id = ca.address_id
    LEFT JOIN Delivery_Assignments da ON o.order_id = da.order_id
    LEFT JOIN Drivers d ON da.driver_id = d.driver_id
    LEFT JOIN Users u ON d.user_id = u.user_id
    WHERE o.order_id = p_order_id;
END$$

CREATE DEFINER=`u595508539_root3`@`127.0.0.1` PROCEDURE `sp_process_payment` (IN `p_order_id` INT, IN `p_transaction_id` VARCHAR(255), IN `p_payment_gateway` VARCHAR(100), IN `p_gateway_response` TEXT, IN `p_payment_status` ENUM('pending','processing','completed','failed','refunded'))   BEGIN
    DECLARE v_current_status VARCHAR(50);
    
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

CREATE DEFINER=`u595508539_root3`@`127.0.0.1` PROCEDURE `sp_update_order_status` (IN `p_order_id` INT, IN `p_new_status` ENUM('pending','confirmed','preparing','ready','out_for_delivery','delivered','cancelled'), IN `p_user_id` INT, IN `p_cancellation_reason` TEXT)   BEGIN
    DECLARE v_current_status VARCHAR(50);
    DECLARE v_restaurant_id INT;
    DECLARE v_customer_id INT;
    DECLARE v_driver_id INT;
    
    SELECT status, restaurant_id, customer_id
    INTO v_current_status, v_restaurant_id, v_customer_id
    FROM Orders 
    WHERE order_id = p_order_id;
    
    CASE 
        WHEN v_current_status = 'cancelled' THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Cannot update a cancelled order';
        
        WHEN p_new_status = 'cancelled' AND v_current_status IN ('delivered', 'out_for_delivery') THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Cannot cancel order that is already out for delivery or delivered';
        
        WHEN p_new_status = 'confirmed' AND v_current_status != 'pending' THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Only pending orders can be confirmed';
            
        WHEN p_new_status = 'delivered' AND v_current_status != 'out_for_delivery' THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Only out_for_delivery orders can be marked as delivered';
    END CASE;
    
    UPDATE Orders 
    SET status = p_new_status,
        cancelled_by = CASE WHEN p_new_status = 'cancelled' THEN p_user_id ELSE cancelled_by END,
        cancellation_reason = CASE WHEN p_new_status = 'cancelled' THEN p_cancellation_reason ELSE cancellation_reason END
    WHERE order_id = p_order_id;
    
    IF p_new_status = 'out_for_delivery' THEN
        SELECT driver_id INTO v_driver_id
        FROM Delivery_Assignments
        WHERE order_id = p_order_id;
    END IF;
    
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
        
    ELSEIF p_new_status = 'preparing' THEN
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
        
    ELSEIF p_new_status = 'ready' THEN
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
        
    ELSEIF p_new_status = 'out_for_delivery' THEN
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
        
    ELSEIF p_new_status = 'delivered' THEN
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
        
    ELSEIF p_new_status = 'cancelled' THEN
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

--
-- Functions
--
CREATE DEFINER=`u595508539_root3`@`127.0.0.1` FUNCTION `fn_is_restaurant_open` (`p_restaurant_id` INT) RETURNS TINYINT(1) DETERMINISTIC BEGIN
    DECLARE v_current_time TIME;
    DECLARE v_opening_time TIME;
    DECLARE v_closing_time TIME;
    DECLARE v_status VARCHAR(50);
    
    SELECT 
        opening_time, 
        closing_time, 
        status
    INTO 
        v_opening_time, 
        v_closing_time, 
        v_status
    FROM Restaurants 
    WHERE restaurant_id = p_restaurant_id;
    
    SET v_current_time = CURRENT_TIME();
    
    RETURN (
        v_status = 'active' 
        AND v_opening_time IS NOT NULL 
        AND v_closing_time IS NOT NULL
        AND (
            (v_opening_time <= v_closing_time AND v_current_time BETWEEN v_opening_time AND v_closing_time)
            OR (v_opening_time > v_closing_time AND (v_current_time >= v_opening_time OR v_current_time <= v_closing_time))
        )
    );
END$$

CREATE DEFINER=`u595508539_root3`@`127.0.0.1` FUNCTION `fn_validate_coupon` (`p_coupon_code` VARCHAR(50), `p_customer_id` INT, `p_order_amount` DECIMAL(10,2), `p_restaurant_id` INT) RETURNS LONGTEXT CHARSET utf8mb4 COLLATE utf8mb4_bin DETERMINISTIC BEGIN
    DECLARE v_coupon JSON;
    
    SELECT JSON_OBJECT(
        'valid', TRUE,
        'discount_amount', 
            CASE 
                WHEN discount_type = 'percentage' THEN 
                    LEAST(p_order_amount * (discount_value / 100), COALESCE(max_discount_amount, p_order_amount))
                ELSE discount_value
            END,
        'message', 'Coupon applied successfully'
    ) INTO v_coupon
    FROM Coupons c
    WHERE code = p_coupon_code
    AND is_active = TRUE
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date >= NOW())
    AND (usage_limit IS NULL OR usage_count < usage_limit)
    AND (applicable_to = 'all' OR 
         (applicable_to = 'restaurant' AND restaurant_id = p_restaurant_id))
    AND p_order_amount >= COALESCE(min_order_amount, 0)
    AND (per_user_limit IS NULL OR 
         (SELECT COUNT(*) FROM Coupon_Usage 
          WHERE coupon_id = c.coupon_id 
          AND customer_id = p_customer_id) < per_user_limit);
    
    RETURN COALESCE(v_coupon, JSON_OBJECT('valid', FALSE, 'message', 'Invalid or expired coupon'));
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `Activity_Logs`
--

CREATE TABLE `Activity_Logs` (
  `log_id` bigint(20) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Cart_Items`
--

CREATE TABLE `Cart_Items` (
  `cart_item_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `menu_item_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1 CHECK (`quantity` > 0),
  `special_requests` text DEFAULT NULL,
  `added_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Coupons`
--

CREATE TABLE `Coupons` (
  `coupon_id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `discount_type` enum('percentage','fixed_amount') NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `min_order_amount` decimal(10,2) DEFAULT 0.00,
  `max_discount_amount` decimal(10,2) DEFAULT NULL,
  `usage_limit` int(11) DEFAULT NULL,
  `usage_count` int(11) DEFAULT 0,
  `per_user_limit` int(11) DEFAULT 1,
  `applicable_to` enum('all','restaurant','category','item') DEFAULT NULL,
  `restaurant_id` int(11) DEFAULT NULL,
  `start_date` timestamp NULL DEFAULT NULL,
  `end_date` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Coupons`
--

INSERT INTO `Coupons` (`coupon_id`, `code`, `description`, `discount_type`, `discount_value`, `min_order_amount`, `max_discount_amount`, `usage_limit`, `usage_count`, `per_user_limit`, `applicable_to`, `restaurant_id`, `start_date`, `end_date`, `is_active`, `created_by`, `created_at`, `updated_at`) VALUES
(1, '1', 'c1', 'fixed_amount', 10.00, 10.00, 100.00, 100, 100, 1, NULL, NULL, '2021-12-21 23:23:17', '2025-12-02 23:23:17', 1, 1, '2025-12-01 21:25:12', '2025-12-01 21:25:12');

-- --------------------------------------------------------

--
-- Table structure for table `Coupon_Usage`
--

CREATE TABLE `Coupon_Usage` (
  `usage_id` int(11) NOT NULL,
  `coupon_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL,
  `used_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Triggers `Coupon_Usage`
--
DELIMITER $$
CREATE TRIGGER `trg_update_coupon_usage` AFTER INSERT ON `Coupon_Usage` FOR EACH ROW BEGIN
    UPDATE Coupons
    SET usage_count = usage_count + 1
    WHERE coupon_id = NEW.coupon_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `Customers`
--

CREATE TABLE `Customers` (
  `customer_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `loyalty_points` int(11) DEFAULT 0 CHECK (`loyalty_points` >= 0),
  `total_orders` int(11) DEFAULT 0,
  `total_spent` decimal(12,2) DEFAULT 0.00,
  `preferred_payment_method` enum('cash','credit_card','debit_card','mobile_wallet','online') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Customers`
--

INSERT INTO `Customers` (`customer_id`, `user_id`, `loyalty_points`, `total_orders`, `total_spent`, `preferred_payment_method`, `created_at`, `updated_at`) VALUES
(1, 1, 0, 0, 0.00, 'cash', '2025-12-01 21:25:51', '2025-12-01 21:25:51');

-- --------------------------------------------------------

--
-- Table structure for table `Customer_Addresses`
--

CREATE TABLE `Customer_Addresses` (
  `address_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `address_label` varchar(50) DEFAULT 'Home',
  `street_address` varchar(255) NOT NULL,
  `apartment_number` varchar(50) DEFAULT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'Egypt',
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT 0,
  `delivery_instructions` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Customer_Addresses`
--

INSERT INTO `Customer_Addresses` (`address_id`, `customer_id`, `address_label`, `street_address`, `apartment_number`, `city`, `state`, `postal_code`, `country`, `latitude`, `longitude`, `is_default`, `delivery_instructions`, `created_at`, `updated_at`) VALUES
(1, 1, 'Home', 'rashid', '1', 'rashid', 'rashid', NULL, 'Egypt', NULL, NULL, 0, NULL, '2025-12-01 21:28:02', '2025-12-01 21:28:02');

--
-- Triggers `Customer_Addresses`
--
DELIMITER $$
CREATE TRIGGER `trg_one_default_address_insert` BEFORE INSERT ON `Customer_Addresses` FOR EACH ROW BEGIN
    IF NEW.is_default = TRUE THEN
        UPDATE Customer_Addresses
        SET is_default = FALSE
        WHERE customer_id = NEW.customer_id;
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_one_default_address_update` BEFORE UPDATE ON `Customer_Addresses` FOR EACH ROW BEGIN
    IF NEW.is_default = TRUE AND OLD.is_default = FALSE THEN
        UPDATE Customer_Addresses
        SET is_default = FALSE
        WHERE customer_id = NEW.customer_id AND address_id != NEW.address_id;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `Delivery_Assignments`
--

CREATE TABLE `Delivery_Assignments` (
  `assignment_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `driver_id` int(11) NOT NULL,
  `assigned_at` timestamp NULL DEFAULT current_timestamp(),
  `accepted_at` timestamp NULL DEFAULT NULL,
  `pickup_time` timestamp NULL DEFAULT NULL,
  `delivery_time` timestamp NULL DEFAULT NULL,
  `delivery_status` enum('assigned','accepted','rejected','picked_up','in_transit','delivered','failed') DEFAULT 'assigned',
  `pickup_latitude` decimal(10,8) DEFAULT NULL,
  `pickup_longitude` decimal(11,8) DEFAULT NULL,
  `delivery_latitude` decimal(10,8) DEFAULT NULL,
  `delivery_longitude` decimal(11,8) DEFAULT NULL,
  `current_latitude` decimal(10,8) DEFAULT NULL,
  `current_longitude` decimal(11,8) DEFAULT NULL,
  `distance_km` decimal(6,2) DEFAULT NULL,
  `delivery_fee` decimal(10,2) DEFAULT NULL,
  `driver_earnings` decimal(10,2) DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `failure_reason` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Delivery_Assignments`
--

INSERT INTO `Delivery_Assignments` (`assignment_id`, `order_id`, `driver_id`, `assigned_at`, `accepted_at`, `pickup_time`, `delivery_time`, `delivery_status`, `pickup_latitude`, `pickup_longitude`, `delivery_latitude`, `delivery_longitude`, `current_latitude`, `current_longitude`, `distance_km`, `delivery_fee`, `driver_earnings`, `rejection_reason`, `failure_reason`, `notes`, `created_at`, `updated_at`) VALUES
(1, 1, 1, '2025-12-01 21:38:16', '2025-12-02 23:40:07', NULL, NULL, 'assigned', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-01 21:38:16', '2025-12-01 21:38:16');

--
-- Triggers `Delivery_Assignments`
--
DELIMITER $$
CREATE TRIGGER `trg_update_driver_stats` AFTER UPDATE ON `Delivery_Assignments` FOR EACH ROW BEGIN
    IF NEW.delivery_status = 'delivered' AND OLD.delivery_status != 'delivered' THEN
        UPDATE Drivers
        SET completed_deliveries = completed_deliveries + 1,
            total_deliveries = total_deliveries + 1,
            earnings_total = earnings_total + COALESCE(NEW.driver_earnings, 0)
        WHERE driver_id = NEW.driver_id;
    END IF;
    
    IF NEW.delivery_status = 'failed' AND OLD.delivery_status != 'failed' THEN
        UPDATE Drivers
        SET cancelled_deliveries = cancelled_deliveries + 1,
            total_deliveries = total_deliveries + 1
        WHERE driver_id = NEW.driver_id;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `Drivers`
--

CREATE TABLE `Drivers` (
  `driver_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `vehicle_type` varchar(50) DEFAULT NULL,
  `vehicle_model` varchar(100) DEFAULT NULL,
  `license_plate` varchar(50) DEFAULT NULL,
  `license_number` varchar(100) DEFAULT NULL,
  `is_available` tinyint(1) DEFAULT 1,
  `is_verified` tinyint(1) DEFAULT 0,
  `current_latitude` decimal(10,8) DEFAULT NULL,
  `current_longitude` decimal(11,8) DEFAULT NULL,
  `rating` decimal(3,2) DEFAULT 0.00 CHECK (`rating` between 0 and 5),
  `total_deliveries` int(11) DEFAULT 0,
  `completed_deliveries` int(11) DEFAULT 0,
  `cancelled_deliveries` int(11) DEFAULT 0,
  `earnings_total` decimal(12,2) DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Drivers`
--

INSERT INTO `Drivers` (`driver_id`, `user_id`, `vehicle_type`, `vehicle_model`, `license_plate`, `license_number`, `is_available`, `is_verified`, `current_latitude`, `current_longitude`, `rating`, `total_deliveries`, `completed_deliveries`, `cancelled_deliveries`, `earnings_total`, `created_at`, `updated_at`) VALUES
(1, 1, 'car', NULL, NULL, NULL, 1, 0, NULL, NULL, 5.00, 0, 0, 0, 0.00, '2025-12-01 21:28:57', '2025-12-01 21:28:57');

-- --------------------------------------------------------

--
-- Table structure for table `Employees`
--

CREATE TABLE `Employees` (
  `employee_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `position` varchar(100) DEFAULT 'staff',
  `hire_date` date DEFAULT NULL,
  `salary` decimal(10,2) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Employees`
--

INSERT INTO `Employees` (`employee_id`, `user_id`, `restaurant_id`, `position`, `hire_date`, `salary`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'staff', '2025-12-03', 100000.00, 1, '2025-12-01 21:31:11', '2025-12-01 21:31:11');

-- --------------------------------------------------------

--
-- Table structure for table `Favorite_Restaurants`
--

CREATE TABLE `Favorite_Restaurants` (
  `favorite_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Menu_Categories`
--

CREATE TABLE `Menu_Categories` (
  `category_id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Menu_Categories`
--

INSERT INTO `Menu_Categories` (`category_id`, `restaurant_id`, `name`, `description`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 'cat1', 'deliciuos ', 0, 1, '2025-12-01 21:31:51', '2025-12-01 21:31:51');

-- --------------------------------------------------------

--
-- Table structure for table `Menu_Items`
--

CREATE TABLE `Menu_Items` (
  `menu_item_id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL CHECK (`price` >= 0),
  `discount_price` decimal(10,2) DEFAULT NULL CHECK (`discount_price` >= 0 and `discount_price` < `price`),
  `image_url` varchar(500) DEFAULT NULL,
  `is_available` tinyint(1) DEFAULT 1,
  `is_featured` tinyint(1) DEFAULT 0,
  `preparation_time` int(11) DEFAULT 15,
  `is_vegetarian` tinyint(1) DEFAULT 0,
  `is_vegan` tinyint(1) DEFAULT 0,
  `is_spicy` tinyint(1) DEFAULT 0,
  `spice_level` enum('mild','medium','hot','extra_hot') DEFAULT NULL,
  `calories` int(11) DEFAULT NULL,
  `allergens` varchar(255) DEFAULT NULL,
  `rating` decimal(3,2) DEFAULT 0.00,
  `total_reviews` int(11) DEFAULT 0,
  `total_orders` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Menu_Items`
--

INSERT INTO `Menu_Items` (`menu_item_id`, `restaurant_id`, `category_id`, `name`, `slug`, `description`, `price`, `discount_price`, `image_url`, `is_available`, `is_featured`, `preparation_time`, `is_vegetarian`, `is_vegan`, `is_spicy`, `spice_level`, `calories`, `allergens`, `rating`, `total_reviews`, `total_orders`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'item1', '', NULL, 100.00, NULL, NULL, 1, 0, 15, 0, 0, 0, NULL, NULL, NULL, 0.00, 0, 1, '2025-12-01 21:32:51', '2025-12-01 21:35:21');

-- --------------------------------------------------------

--
-- Table structure for table `Menu_Item_Inventory`
--

CREATE TABLE `Menu_Item_Inventory` (
  `inventory_id` int(11) NOT NULL,
  `menu_item_id` int(11) NOT NULL,
  `stock_quantity` int(11) DEFAULT 0 CHECK (`stock_quantity` >= 0),
  `low_stock_threshold` int(11) DEFAULT 10,
  `last_restocked_at` timestamp NULL DEFAULT NULL,
  `last_restocked_quantity` int(11) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Menu_Item_Inventory`
--

INSERT INTO `Menu_Item_Inventory` (`inventory_id`, `menu_item_id`, `stock_quantity`, `low_stock_threshold`, `last_restocked_at`, `last_restocked_quantity`, `updated_at`) VALUES
(1, 1, 5, 10, '2025-12-03 23:32:58', 15, '2025-12-01 21:33:21');

-- --------------------------------------------------------

--
-- Table structure for table `Menu_Item_Reviews`
--

CREATE TABLE `Menu_Item_Reviews` (
  `item_review_id` int(11) NOT NULL,
  `order_item_id` int(11) NOT NULL,
  `menu_item_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` between 1 and 5),
  `comment` text DEFAULT NULL,
  `is_visible` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Triggers `Menu_Item_Reviews`
--
DELIMITER $$
CREATE TRIGGER `trg_update_menu_item_rating` AFTER INSERT ON `Menu_Item_Reviews` FOR EACH ROW BEGIN
    UPDATE Menu_Items mi
    SET mi.rating = (
        SELECT AVG(rating) 
        FROM Menu_Item_Reviews 
        WHERE menu_item_id = NEW.menu_item_id 
        AND is_visible = TRUE
    ),
    mi.total_reviews = (
        SELECT COUNT(*) 
        FROM Menu_Item_Reviews 
        WHERE menu_item_id = NEW.menu_item_id 
        AND is_visible = TRUE
    )
    WHERE mi.menu_item_id = NEW.menu_item_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `Notifications`
--

CREATE TABLE `Notifications` (
  `notification_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` enum('order_update','delivery_update','promotion','review_request','system') NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  `is_read` tinyint(1) DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Orders`
--

CREATE TABLE `Orders` (
  `order_id` int(11) NOT NULL,
  `order_number` varchar(50) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `delivery_address_id` int(11) NOT NULL,
  `order_date` timestamp NULL DEFAULT current_timestamp(),
  `status` enum('pending','confirmed','preparing','ready','out_for_delivery','delivered','cancelled') DEFAULT 'pending',
  `payment_status` enum('pending','completed','failed','refunded') DEFAULT 'pending',
  `subtotal` decimal(10,2) NOT NULL CHECK (`subtotal` >= 0),
  `delivery_fee` decimal(10,2) DEFAULT 0.00,
  `tax` decimal(10,2) DEFAULT 0.00,
  `discount` decimal(10,2) DEFAULT 0.00,
  `loyalty_points_used` int(11) DEFAULT 0,
  `loyalty_discount` decimal(10,2) DEFAULT 0.00,
  `total_amount` decimal(10,2) NOT NULL CHECK (`total_amount` >= 0),
  `special_instructions` text DEFAULT NULL,
  `estimated_prep_time` int(11) DEFAULT NULL,
  `estimated_delivery_time` timestamp NULL DEFAULT NULL,
  `actual_delivery_time` timestamp NULL DEFAULT NULL,
  `confirmed_at` timestamp NULL DEFAULT NULL,
  `preparing_at` timestamp NULL DEFAULT NULL,
  `ready_at` timestamp NULL DEFAULT NULL,
  `out_for_delivery_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL,
  `cancelled_by` int(11) DEFAULT NULL,
  `rating` int(11) DEFAULT NULL CHECK (`rating` between 1 and 5),
  `review_comment` text DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Orders`
--

INSERT INTO `Orders` (`order_id`, `order_number`, `customer_id`, `restaurant_id`, `delivery_address_id`, `order_date`, `status`, `payment_status`, `subtotal`, `delivery_fee`, `tax`, `discount`, `loyalty_points_used`, `loyalty_discount`, `total_amount`, `special_instructions`, `estimated_prep_time`, `estimated_delivery_time`, `actual_delivery_time`, `confirmed_at`, `preparing_at`, `ready_at`, `out_for_delivery_at`, `delivered_at`, `cancelled_at`, `cancellation_reason`, `cancelled_by`, `rating`, `review_comment`, `reviewed_at`, `created_at`, `updated_at`) VALUES
(1, 'ORD20251201000006', 1, 1, 1, '2025-12-01 21:34:41', 'pending', 'pending', 10.00, 10.00, 5.00, 0.00, 0, 0.00, 25.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-01 21:34:41', '2025-12-01 21:35:21');

--
-- Triggers `Orders`
--
DELIMITER $$
CREATE TRIGGER `trg_clear_cart_after_order` AFTER INSERT ON `Orders` FOR EACH ROW BEGIN
    DELETE FROM Cart_Items 
    WHERE customer_id = NEW.customer_id 
    AND restaurant_id = NEW.restaurant_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_decrement_inventory` AFTER UPDATE ON `Orders` FOR EACH ROW BEGIN
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
        UPDATE Menu_Item_Inventory mii
        JOIN Order_Items oi ON mii.menu_item_id = oi.menu_item_id
        SET mii.stock_quantity = mii.stock_quantity - oi.quantity
        WHERE oi.order_id = NEW.order_id AND mii.stock_quantity >= oi.quantity;
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_generate_order_number` BEFORE INSERT ON `Orders` FOR EACH ROW BEGIN
    INSERT INTO order_sequence VALUES (NULL);
    SET NEW.order_number = CONCAT(
        'ORD',
        DATE_FORMAT(NEW.order_date, '%Y%m%d'),
        LPAD(LAST_INSERT_ID(), 6, '0')
    );
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_log_order_status_change` AFTER UPDATE ON `Orders` FOR EACH ROW BEGIN
    IF NEW.status != OLD.status THEN
        INSERT INTO Order_Status_History (
            order_id, 
            old_status, 
            new_status, 
            changed_by
        ) VALUES (
            NEW.order_id,
            OLD.status,
            NEW.status,
            NEW.cancelled_by
        );
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_update_customer_stats` AFTER UPDATE ON `Orders` FOR EACH ROW BEGIN
    IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
        UPDATE Customers
        SET total_orders = total_orders + 1,
            total_spent = total_spent + NEW.total_amount,
            loyalty_points = loyalty_points + FLOOR(NEW.total_amount / 10)
        WHERE customer_id = NEW.customer_id;
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_update_order_timestamps` BEFORE UPDATE ON `Orders` FOR EACH ROW BEGIN
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
        SET NEW.confirmed_at = CURRENT_TIMESTAMP;
    ELSEIF NEW.status = 'preparing' AND OLD.status != 'preparing' THEN
        SET NEW.preparing_at = CURRENT_TIMESTAMP;
    ELSEIF NEW.status = 'ready' AND OLD.status != 'ready' THEN
        SET NEW.ready_at = CURRENT_TIMESTAMP;
    ELSEIF NEW.status = 'out_for_delivery' AND OLD.status != 'out_for_delivery' THEN
        SET NEW.out_for_delivery_at = CURRENT_TIMESTAMP;
    ELSEIF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
        SET NEW.delivered_at = CURRENT_TIMESTAMP;
        SET NEW.actual_delivery_time = CURRENT_TIMESTAMP;
    ELSEIF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        SET NEW.cancelled_at = CURRENT_TIMESTAMP;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `Order_Items`
--

CREATE TABLE `Order_Items` (
  `order_item_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `menu_item_id` int(11) NOT NULL,
  `menu_item_name` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL CHECK (`quantity` > 0),
  `unit_price` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `special_requests` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Order_Items`
--

INSERT INTO `Order_Items` (`order_item_id`, `order_id`, `menu_item_id`, `menu_item_name`, `quantity`, `unit_price`, `subtotal`, `special_requests`, `created_at`) VALUES
(1, 1, 1, 'item1', 1, 10.00, 10.00, NULL, '2025-12-01 21:35:21');

--
-- Triggers `Order_Items`
--
DELIMITER $$
CREATE TRIGGER `trg_update_menu_item_popularity` AFTER INSERT ON `Order_Items` FOR EACH ROW BEGIN
    UPDATE Menu_Items
    SET total_orders = total_orders + NEW.quantity
    WHERE menu_item_id = NEW.menu_item_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_update_order_totals_delete` AFTER DELETE ON `Order_Items` FOR EACH ROW BEGIN
    DECLARE v_subtotal DECIMAL(10,2);
    DECLARE v_total DECIMAL(10,2);
    
    SELECT SUM(subtotal) INTO v_subtotal 
    FROM Order_Items 
    WHERE order_id = OLD.order_id;
    
    SET v_total = COALESCE(v_subtotal, 0) 
        + COALESCE((SELECT delivery_fee FROM Orders WHERE order_id = OLD.order_id), 0)
        + COALESCE((SELECT tax FROM Orders WHERE order_id = OLD.order_id), 0)
        - COALESCE((SELECT discount FROM Orders WHERE order_id = OLD.order_id), 0);
    
    UPDATE Orders 
    SET subtotal = COALESCE(v_subtotal, 0),
        total_amount = v_total
    WHERE order_id = OLD.order_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_update_order_totals_insert` AFTER INSERT ON `Order_Items` FOR EACH ROW BEGIN
    DECLARE v_subtotal DECIMAL(10,2);
    DECLARE v_total DECIMAL(10,2);
    
    SELECT SUM(subtotal) INTO v_subtotal 
    FROM Order_Items 
    WHERE order_id = NEW.order_id;
    
    SET v_total = COALESCE(v_subtotal, 0) 
        + COALESCE((SELECT delivery_fee FROM Orders WHERE order_id = NEW.order_id), 0)
        + COALESCE((SELECT tax FROM Orders WHERE order_id = NEW.order_id), 0)
        - COALESCE((SELECT discount FROM Orders WHERE order_id = NEW.order_id), 0);
    
    UPDATE Orders 
    SET subtotal = COALESCE(v_subtotal, 0),
        total_amount = v_total
    WHERE order_id = NEW.order_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_update_order_totals_update` AFTER UPDATE ON `Order_Items` FOR EACH ROW BEGIN
    DECLARE v_subtotal DECIMAL(10,2);
    DECLARE v_total DECIMAL(10,2);
    
    SELECT SUM(subtotal) INTO v_subtotal 
    FROM Order_Items 
    WHERE order_id = NEW.order_id;
    
    SET v_total = COALESCE(v_subtotal, 0) 
        + COALESCE((SELECT delivery_fee FROM Orders WHERE order_id = NEW.order_id), 0)
        + COALESCE((SELECT tax FROM Orders WHERE order_id = NEW.order_id), 0)
        - COALESCE((SELECT discount FROM Orders WHERE order_id = NEW.order_id), 0);
    
    UPDATE Orders 
    SET subtotal = COALESCE(v_subtotal, 0),
        total_amount = v_total
    WHERE order_id = NEW.order_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `order_sequence`
--

CREATE TABLE `order_sequence` (
  `seq_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Order_Status_History`
--

CREATE TABLE `Order_Status_History` (
  `history_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `old_status` varchar(50) DEFAULT NULL,
  `new_status` varchar(50) NOT NULL,
  `changed_by` int(11) DEFAULT NULL,
  `changed_at` timestamp NULL DEFAULT current_timestamp(),
  `notes` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Payments`
--

CREATE TABLE `Payments` (
  `payment_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `payment_method` enum('cash','credit_card','debit_card','mobile_wallet','online') NOT NULL,
  `payment_status` enum('pending','processing','completed','failed','refunded') DEFAULT 'pending',
  `amount` decimal(10,2) NOT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `payment_gateway` varchar(100) DEFAULT NULL,
  `gateway_response` text DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `refund_amount` decimal(10,2) DEFAULT 0.00,
  `refunded_at` timestamp NULL DEFAULT NULL,
  `refund_reason` text DEFAULT NULL,
  `failure_reason` text DEFAULT NULL,
  `retry_count` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Payments`
--

INSERT INTO `Payments` (`payment_id`, `order_id`, `payment_method`, `payment_status`, `amount`, `transaction_id`, `payment_gateway`, `gateway_response`, `paid_at`, `refund_amount`, `refunded_at`, `refund_reason`, `failure_reason`, `retry_count`, `created_at`, `updated_at`) VALUES
(1, 1, 'debit_card', 'pending', 100.00, '1', NULL, NULL, NULL, 10.00, NULL, NULL, NULL, 0, '2025-12-01 21:36:40', '2025-12-01 21:36:40');

-- --------------------------------------------------------

--
-- Table structure for table `Restaurants`
--

CREATE TABLE `Restaurants` (
  `restaurant_id` int(11) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `street_address` varchar(255) NOT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `opening_time` time DEFAULT NULL,
  `closing_time` time DEFAULT NULL,
  `status` enum('active','inactive','temporarily_closed') DEFAULT 'active',
  `rating` decimal(3,2) DEFAULT 0.00 CHECK (`rating` between 0 and 5),
  `total_reviews` int(11) DEFAULT 0,
  `image_url` varchar(500) DEFAULT NULL,
  `banner_url` varchar(500) DEFAULT NULL,
  `delivery_fee` decimal(10,2) DEFAULT 0.00,
  `minimum_order` decimal(10,2) DEFAULT 0.00,
  `estimated_delivery_time` int(11) DEFAULT 30,
  `cuisine_type` varchar(100) DEFAULT NULL,
  `is_featured` tinyint(1) DEFAULT 0,
  `commission_rate` decimal(5,2) DEFAULT 15.00,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Restaurants`
--

INSERT INTO `Restaurants` (`restaurant_id`, `owner_id`, `name`, `slug`, `description`, `phone`, `email`, `street_address`, `city`, `state`, `postal_code`, `latitude`, `longitude`, `opening_time`, `closing_time`, `status`, `rating`, `total_reviews`, `image_url`, `banner_url`, `delivery_fee`, `minimum_order`, `estimated_delivery_time`, `cuisine_type`, `is_featured`, `commission_rate`, `created_at`, `updated_at`) VALUES
(1, 1, 'yasser', '', NULL, NULL, NULL, 'rashid', 'rashid', 'rashid', NULL, NULL, NULL, NULL, NULL, 'active', 0.00, 0, NULL, NULL, 0.00, 0.00, 30, NULL, 0, 15.00, '2025-12-01 21:30:19', '2025-12-01 21:30:19');

-- --------------------------------------------------------

--
-- Table structure for table `Reviews`
--

CREATE TABLE `Reviews` (
  `review_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` between 1 and 5),
  `food_rating` int(11) DEFAULT NULL CHECK (`food_rating` between 1 and 5),
  `delivery_rating` int(11) DEFAULT NULL CHECK (`delivery_rating` between 1 and 5),
  `comment` text DEFAULT NULL,
  `is_verified_purchase` tinyint(1) DEFAULT 1,
  `is_visible` tinyint(1) DEFAULT 1,
  `helpful_count` int(11) DEFAULT 0,
  `reported_count` int(11) DEFAULT 0,
  `restaurant_response` text DEFAULT NULL,
  `responded_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Triggers `Reviews`
--
DELIMITER $$
CREATE TRIGGER `trg_update_restaurant_rating_insert` AFTER INSERT ON `Reviews` FOR EACH ROW BEGIN
    UPDATE Restaurants r
    SET r.rating = (
        SELECT AVG(rating) 
        FROM Reviews 
        WHERE restaurant_id = NEW.restaurant_id 
        AND is_visible = TRUE
    ),
    r.total_reviews = (
        SELECT COUNT(*) 
        FROM Reviews 
        WHERE restaurant_id = NEW.restaurant_id 
        AND is_visible = TRUE
    )
    WHERE r.restaurant_id = NEW.restaurant_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_update_restaurant_rating_update` AFTER UPDATE ON `Reviews` FOR EACH ROW BEGIN
    UPDATE Restaurants r
    SET r.rating = (
        SELECT AVG(rating) 
        FROM Reviews 
        WHERE restaurant_id = NEW.restaurant_id 
        AND is_visible = TRUE
    ),
    r.total_reviews = (
        SELECT COUNT(*) 
        FROM Reviews 
        WHERE restaurant_id = NEW.restaurant_id 
        AND is_visible = TRUE
    )
    WHERE r.restaurant_id = NEW.restaurant_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `Users`
--

CREATE TABLE `Users` (
  `user_id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('customer','restaurant_owner','employee','driver','admin') NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `full_name` varchar(255) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `email_verified` tinyint(1) DEFAULT 0,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Users`
--

INSERT INTO `Users` (`user_id`, `email`, `password_hash`, `role`, `phone`, `full_name`, `is_active`, `email_verified`, `last_login_at`, `created_at`, `updated_at`) VALUES
(1, 'yasser@gmail.com', 'kjedncme4e8du', 'admin', '01003640081', 'Yasser Ashraf', 1, 0, '0000-00-00 00:00:00', '2025-12-01 21:14:29', '2025-12-01 21:14:29');

--
-- Triggers `Users`
--
DELIMITER $$
CREATE TRIGGER `trg_create_customer_profile` AFTER INSERT ON `Users` FOR EACH ROW BEGIN
    IF NEW.role = 'customer' THEN
        INSERT INTO Customers (user_id, full_name) 
        VALUES (NEW.user_id, NEW.full_name);
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_customer_orders`
-- (See below for the actual view)
--
CREATE TABLE `vw_customer_orders` (
`customer_id` int(11)
,`customer_name` varchar(255)
,`email` varchar(255)
,`total_orders` int(11)
,`total_spent` decimal(12,2)
,`loyalty_points` int(11)
,`order_id` int(11)
,`order_number` varchar(50)
,`order_date` timestamp
,`status` enum('pending','confirmed','preparing','ready','out_for_delivery','delivered','cancelled')
,`total_amount` decimal(10,2)
,`restaurant_name` varchar(255)
,`order_rating` int(11)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_daily_sales`
-- (See below for the actual view)
--
CREATE TABLE `vw_daily_sales` (
`restaurant_id` int(11)
,`restaurant_name` varchar(255)
,`order_date` date
,`total_orders` bigint(21)
,`total_revenue` decimal(32,2)
,`avg_order_value` decimal(14,6)
,`completed_orders` decimal(22,0)
,`cancelled_orders` decimal(22,0)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_driver_performance`
-- (See below for the actual view)
--
CREATE TABLE `vw_driver_performance` (
`driver_id` int(11)
,`full_name` varchar(255)
,`vehicle_type` varchar(50)
,`rating` decimal(3,2)
,`total_deliveries` int(11)
,`completed_deliveries` int(11)
,`cancelled_deliveries` int(11)
,`earnings_total` decimal(12,2)
,`assignments_7d` bigint(21)
,`completion_rate` decimal(16,2)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_popular_menu_items`
-- (See below for the actual view)
--
CREATE TABLE `vw_popular_menu_items` (
`restaurant_id` int(11)
,`restaurant_name` varchar(255)
,`menu_item_id` int(11)
,`item_name` varchar(255)
,`price` decimal(10,2)
,`rating` decimal(3,2)
,`total_reviews` int(11)
,`total_orders` int(11)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_restaurant_performance`
-- (See below for the actual view)
--
CREATE TABLE `vw_restaurant_performance` (
`restaurant_id` int(11)
,`name` varchar(255)
,`rating` decimal(3,2)
,`total_reviews` int(11)
,`total_orders_30d` bigint(21)
,`revenue_30d` decimal(32,2)
,`avg_order_value_30d` decimal(14,6)
,`unique_customers_30d` bigint(21)
);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `Activity_Logs`
--
ALTER TABLE `Activity_Logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_entity` (`entity_type`,`entity_id`),
  ADD KEY `idx_created` (`created_at`);

--
-- Indexes for table `Cart_Items`
--
ALTER TABLE `Cart_Items`
  ADD PRIMARY KEY (`cart_item_id`),
  ADD UNIQUE KEY `unique_cart_item` (`customer_id`,`menu_item_id`),
  ADD KEY `restaurant_id` (`restaurant_id`),
  ADD KEY `menu_item_id` (`menu_item_id`),
  ADD KEY `idx_customer` (`customer_id`),
  ADD KEY `idx_restaurant` (`customer_id`,`restaurant_id`),
  ADD KEY `idx_cart_customer_restaurant` (`customer_id`,`restaurant_id`,`added_at` DESC);

--
-- Indexes for table `Coupons`
--
ALTER TABLE `Coupons`
  ADD PRIMARY KEY (`coupon_id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `restaurant_id` (`restaurant_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_code` (`code`),
  ADD KEY `idx_active` (`is_active`),
  ADD KEY `idx_dates` (`start_date`,`end_date`);

--
-- Indexes for table `Coupon_Usage`
--
ALTER TABLE `Coupon_Usage`
  ADD PRIMARY KEY (`usage_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `idx_coupon` (`coupon_id`),
  ADD KEY `idx_customer` (`customer_id`);

--
-- Indexes for table `Customers`
--
ALTER TABLE `Customers`
  ADD PRIMARY KEY (`customer_id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `idx_loyalty` (`loyalty_points`);

--
-- Indexes for table `Customer_Addresses`
--
ALTER TABLE `Customer_Addresses`
  ADD PRIMARY KEY (`address_id`),
  ADD KEY `idx_customer` (`customer_id`),
  ADD KEY `idx_default` (`customer_id`,`is_default`);

--
-- Indexes for table `Delivery_Assignments`
--
ALTER TABLE `Delivery_Assignments`
  ADD PRIMARY KEY (`assignment_id`),
  ADD UNIQUE KEY `order_id` (`order_id`),
  ADD KEY `idx_driver` (`driver_id`),
  ADD KEY `idx_status` (`delivery_status`),
  ADD KEY `idx_assigned_at` (`assigned_at`),
  ADD KEY `idx_delivery_assignments_status` (`delivery_status`,`assigned_at`);

--
-- Indexes for table `Drivers`
--
ALTER TABLE `Drivers`
  ADD PRIMARY KEY (`driver_id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `license_plate` (`license_plate`),
  ADD KEY `idx_available` (`is_available`),
  ADD KEY `idx_location` (`current_latitude`,`current_longitude`);

--
-- Indexes for table `Employees`
--
ALTER TABLE `Employees`
  ADD PRIMARY KEY (`employee_id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `idx_restaurant` (`restaurant_id`),
  ADD KEY `idx_active` (`is_active`);

--
-- Indexes for table `Favorite_Restaurants`
--
ALTER TABLE `Favorite_Restaurants`
  ADD PRIMARY KEY (`favorite_id`),
  ADD UNIQUE KEY `unique_favorite` (`customer_id`,`restaurant_id`),
  ADD KEY `restaurant_id` (`restaurant_id`),
  ADD KEY `idx_customer` (`customer_id`);

--
-- Indexes for table `Menu_Categories`
--
ALTER TABLE `Menu_Categories`
  ADD PRIMARY KEY (`category_id`),
  ADD KEY `idx_restaurant` (`restaurant_id`),
  ADD KEY `idx_display` (`restaurant_id`,`display_order`);

--
-- Indexes for table `Menu_Items`
--
ALTER TABLE `Menu_Items`
  ADD PRIMARY KEY (`menu_item_id`),
  ADD UNIQUE KEY `unique_slug` (`restaurant_id`,`slug`),
  ADD KEY `idx_restaurant` (`restaurant_id`),
  ADD KEY `idx_category` (`category_id`),
  ADD KEY `idx_available` (`is_available`),
  ADD KEY `idx_featured` (`is_featured`),
  ADD KEY `idx_menu_items_category_available` (`category_id`,`is_available`);
ALTER TABLE `Menu_Items` ADD FULLTEXT KEY `idx_search` (`name`,`description`);

--
-- Indexes for table `Menu_Item_Inventory`
--
ALTER TABLE `Menu_Item_Inventory`
  ADD PRIMARY KEY (`inventory_id`),
  ADD UNIQUE KEY `menu_item_id` (`menu_item_id`);

--
-- Indexes for table `Menu_Item_Reviews`
--
ALTER TABLE `Menu_Item_Reviews`
  ADD PRIMARY KEY (`item_review_id`),
  ADD UNIQUE KEY `unique_item_review` (`order_item_id`,`menu_item_id`),
  ADD KEY `idx_menu_item` (`menu_item_id`),
  ADD KEY `idx_customer` (`customer_id`);

--
-- Indexes for table `Notifications`
--
ALTER TABLE `Notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_read` (`user_id`,`is_read`),
  ADD KEY `idx_created` (`created_at`),
  ADD KEY `idx_notifications_user_unread` (`user_id`,`is_read`,`created_at` DESC);

--
-- Indexes for table `Orders`
--
ALTER TABLE `Orders`
  ADD PRIMARY KEY (`order_id`),
  ADD UNIQUE KEY `order_number` (`order_number`),
  ADD KEY `delivery_address_id` (`delivery_address_id`),
  ADD KEY `cancelled_by` (`cancelled_by`),
  ADD KEY `idx_order_number` (`order_number`),
  ADD KEY `idx_customer` (`customer_id`),
  ADD KEY `idx_restaurant` (`restaurant_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_payment_status` (`payment_status`),
  ADD KEY `idx_order_date` (`order_date`),
  ADD KEY `idx_restaurant_date` (`restaurant_id`,`order_date`),
  ADD KEY `idx_orders_customer_date` (`customer_id`,`order_date` DESC),
  ADD KEY `idx_orders_restaurant_status` (`restaurant_id`,`status`,`order_date` DESC);

--
-- Indexes for table `Order_Items`
--
ALTER TABLE `Order_Items`
  ADD PRIMARY KEY (`order_item_id`),
  ADD KEY `idx_order` (`order_id`),
  ADD KEY `idx_menu_item` (`menu_item_id`),
  ADD KEY `idx_order_items_menu_item` (`menu_item_id`,`order_id`);

--
-- Indexes for table `order_sequence`
--
ALTER TABLE `order_sequence`
  ADD PRIMARY KEY (`seq_id`);

--
-- Indexes for table `Order_Status_History`
--
ALTER TABLE `Order_Status_History`
  ADD PRIMARY KEY (`history_id`),
  ADD KEY `changed_by` (`changed_by`),
  ADD KEY `idx_order` (`order_id`),
  ADD KEY `idx_changed_at` (`changed_at`);

--
-- Indexes for table `Payments`
--
ALTER TABLE `Payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD UNIQUE KEY `order_id` (`order_id`),
  ADD UNIQUE KEY `transaction_id` (`transaction_id`),
  ADD KEY `idx_status` (`payment_status`),
  ADD KEY `idx_transaction` (`transaction_id`),
  ADD KEY `idx_method` (`payment_method`),
  ADD KEY `idx_paid_at` (`paid_at`),
  ADD KEY `idx_payments_order_status` (`order_id`,`payment_status`);

--
-- Indexes for table `Restaurants`
--
ALTER TABLE `Restaurants`
  ADD PRIMARY KEY (`restaurant_id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `owner_id` (`owner_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_city` (`city`),
  ADD KEY `idx_rating` (`rating`),
  ADD KEY `idx_featured` (`is_featured`);
ALTER TABLE `Restaurants` ADD FULLTEXT KEY `idx_search` (`name`,`description`,`cuisine_type`);

--
-- Indexes for table `Reviews`
--
ALTER TABLE `Reviews`
  ADD PRIMARY KEY (`review_id`),
  ADD UNIQUE KEY `unique_order_review` (`order_id`),
  ADD KEY `idx_restaurant` (`restaurant_id`),
  ADD KEY `idx_customer` (`customer_id`),
  ADD KEY `idx_rating` (`rating`),
  ADD KEY `idx_visible` (`is_visible`),
  ADD KEY `idx_reviews_restaurant_date` (`restaurant_id`,`created_at` DESC);

--
-- Indexes for table `Users`
--
ALTER TABLE `Users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `idx_active` (`is_active`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `Activity_Logs`
--
ALTER TABLE `Activity_Logs`
  MODIFY `log_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Cart_Items`
--
ALTER TABLE `Cart_Items`
  MODIFY `cart_item_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Coupons`
--
ALTER TABLE `Coupons`
  MODIFY `coupon_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `Coupon_Usage`
--
ALTER TABLE `Coupon_Usage`
  MODIFY `usage_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Customers`
--
ALTER TABLE `Customers`
  MODIFY `customer_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `Customer_Addresses`
--
ALTER TABLE `Customer_Addresses`
  MODIFY `address_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `Delivery_Assignments`
--
ALTER TABLE `Delivery_Assignments`
  MODIFY `assignment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `Drivers`
--
ALTER TABLE `Drivers`
  MODIFY `driver_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `Employees`
--
ALTER TABLE `Employees`
  MODIFY `employee_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `Favorite_Restaurants`
--
ALTER TABLE `Favorite_Restaurants`
  MODIFY `favorite_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Menu_Categories`
--
ALTER TABLE `Menu_Categories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `Menu_Items`
--
ALTER TABLE `Menu_Items`
  MODIFY `menu_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `Menu_Item_Inventory`
--
ALTER TABLE `Menu_Item_Inventory`
  MODIFY `inventory_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `Menu_Item_Reviews`
--
ALTER TABLE `Menu_Item_Reviews`
  MODIFY `item_review_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Notifications`
--
ALTER TABLE `Notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Orders`
--
ALTER TABLE `Orders`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `Order_Items`
--
ALTER TABLE `Order_Items`
  MODIFY `order_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `order_sequence`
--
ALTER TABLE `order_sequence`
  MODIFY `seq_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `Order_Status_History`
--
ALTER TABLE `Order_Status_History`
  MODIFY `history_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Payments`
--
ALTER TABLE `Payments`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `Restaurants`
--
ALTER TABLE `Restaurants`
  MODIFY `restaurant_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `Reviews`
--
ALTER TABLE `Reviews`
  MODIFY `review_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Users`
--
ALTER TABLE `Users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

-- --------------------------------------------------------

--
-- Structure for view `vw_customer_orders`
--
DROP TABLE IF EXISTS `vw_customer_orders`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u595508539_root3`@`127.0.0.1` SQL SECURITY DEFINER VIEW `vw_customer_orders`  AS SELECT `c`.`customer_id` AS `customer_id`, `u`.`full_name` AS `customer_name`, `u`.`email` AS `email`, `c`.`total_orders` AS `total_orders`, `c`.`total_spent` AS `total_spent`, `c`.`loyalty_points` AS `loyalty_points`, `o`.`order_id` AS `order_id`, `o`.`order_number` AS `order_number`, `o`.`order_date` AS `order_date`, `o`.`status` AS `status`, `o`.`total_amount` AS `total_amount`, `r`.`name` AS `restaurant_name`, `o`.`rating` AS `order_rating` FROM (((`Customers` `c` join `Users` `u` on(`c`.`user_id` = `u`.`user_id`)) join `Orders` `o` on(`c`.`customer_id` = `o`.`customer_id`)) join `Restaurants` `r` on(`o`.`restaurant_id` = `r`.`restaurant_id`)) ;

-- --------------------------------------------------------

--
-- Structure for view `vw_daily_sales`
--
DROP TABLE IF EXISTS `vw_daily_sales`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u595508539_root3`@`127.0.0.1` SQL SECURITY DEFINER VIEW `vw_daily_sales`  AS SELECT `r`.`restaurant_id` AS `restaurant_id`, `r`.`name` AS `restaurant_name`, cast(`o`.`order_date` as date) AS `order_date`, count(0) AS `total_orders`, sum(`o`.`total_amount`) AS `total_revenue`, avg(`o`.`total_amount`) AS `avg_order_value`, sum(case when `o`.`status` = 'delivered' then 1 else 0 end) AS `completed_orders`, sum(case when `o`.`status` = 'cancelled' then 1 else 0 end) AS `cancelled_orders` FROM (`Restaurants` `r` left join `Orders` `o` on(`r`.`restaurant_id` = `o`.`restaurant_id`)) WHERE `o`.`order_date` >= curdate() - interval 30 day GROUP BY `r`.`restaurant_id`, cast(`o`.`order_date` as date) ;

-- --------------------------------------------------------

--
-- Structure for view `vw_driver_performance`
--
DROP TABLE IF EXISTS `vw_driver_performance`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u595508539_root3`@`127.0.0.1` SQL SECURITY DEFINER VIEW `vw_driver_performance`  AS SELECT `d`.`driver_id` AS `driver_id`, `u`.`full_name` AS `full_name`, `d`.`vehicle_type` AS `vehicle_type`, `d`.`rating` AS `rating`, `d`.`total_deliveries` AS `total_deliveries`, `d`.`completed_deliveries` AS `completed_deliveries`, `d`.`cancelled_deliveries` AS `cancelled_deliveries`, `d`.`earnings_total` AS `earnings_total`, count(`da`.`assignment_id`) AS `assignments_7d`, round(`d`.`completed_deliveries` / nullif(`d`.`total_deliveries`,0) * 100,2) AS `completion_rate` FROM ((`Drivers` `d` join `Users` `u` on(`d`.`user_id` = `u`.`user_id`)) left join `Delivery_Assignments` `da` on(`d`.`driver_id` = `da`.`driver_id` and `da`.`assigned_at` >= curdate() - interval 7 day)) GROUP BY `d`.`driver_id` ;

-- --------------------------------------------------------

--
-- Structure for view `vw_popular_menu_items`
--
DROP TABLE IF EXISTS `vw_popular_menu_items`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u595508539_root3`@`127.0.0.1` SQL SECURITY DEFINER VIEW `vw_popular_menu_items`  AS SELECT `mi`.`restaurant_id` AS `restaurant_id`, `r`.`name` AS `restaurant_name`, `mi`.`menu_item_id` AS `menu_item_id`, `mi`.`name` AS `item_name`, `mi`.`price` AS `price`, `mi`.`rating` AS `rating`, `mi`.`total_reviews` AS `total_reviews`, `mi`.`total_orders` AS `total_orders` FROM (`Menu_Items` `mi` join `Restaurants` `r` on(`mi`.`restaurant_id` = `r`.`restaurant_id`)) WHERE `mi`.`total_orders` > 0 ORDER BY `mi`.`total_orders` DESC ;

-- --------------------------------------------------------

--
-- Structure for view `vw_restaurant_performance`
--
DROP TABLE IF EXISTS `vw_restaurant_performance`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u595508539_root3`@`127.0.0.1` SQL SECURITY DEFINER VIEW `vw_restaurant_performance`  AS SELECT `r`.`restaurant_id` AS `restaurant_id`, `r`.`name` AS `name`, `r`.`rating` AS `rating`, `r`.`total_reviews` AS `total_reviews`, count(distinct `o`.`order_id`) AS `total_orders_30d`, sum(case when `o`.`order_date` >= curdate() - interval 30 day then `o`.`total_amount` else 0 end) AS `revenue_30d`, avg(case when `o`.`order_date` >= curdate() - interval 30 day then `o`.`total_amount` end) AS `avg_order_value_30d`, count(distinct `o`.`customer_id`) AS `unique_customers_30d` FROM (`Restaurants` `r` left join `Orders` `o` on(`r`.`restaurant_id` = `o`.`restaurant_id` and `o`.`order_date` >= curdate() - interval 30 day)) GROUP BY `r`.`restaurant_id` ;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `Activity_Logs`
--
ALTER TABLE `Activity_Logs`
  ADD CONSTRAINT `Activity_Logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `Cart_Items`
--
ALTER TABLE `Cart_Items`
  ADD CONSTRAINT `Cart_Items_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `Customers` (`customer_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `Cart_Items_ibfk_2` FOREIGN KEY (`restaurant_id`) REFERENCES `Restaurants` (`restaurant_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `Cart_Items_ibfk_3` FOREIGN KEY (`menu_item_id`) REFERENCES `Menu_Items` (`menu_item_id`) ON DELETE CASCADE;

--
-- Constraints for table `Coupons`
--
ALTER TABLE `Coupons`
  ADD CONSTRAINT `Coupons_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `Restaurants` (`restaurant_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `Coupons_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `Users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `Coupon_Usage`
--
ALTER TABLE `Coupon_Usage`
  ADD CONSTRAINT `Coupon_Usage_ibfk_1` FOREIGN KEY (`coupon_id`) REFERENCES `Coupons` (`coupon_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `Coupon_Usage_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `Customers` (`customer_id`),
  ADD CONSTRAINT `Coupon_Usage_ibfk_3` FOREIGN KEY (`order_id`) REFERENCES `Orders` (`order_id`) ON DELETE CASCADE;

--
-- Constraints for table `Customers`
--
ALTER TABLE `Customers`
  ADD CONSTRAINT `Customers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `Customer_Addresses`
--
ALTER TABLE `Customer_Addresses`
  ADD CONSTRAINT `Customer_Addresses_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `Customers` (`customer_id`) ON DELETE CASCADE;

--
-- Constraints for table `Delivery_Assignments`
--
ALTER TABLE `Delivery_Assignments`
  ADD CONSTRAINT `Delivery_Assignments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `Orders` (`order_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `Delivery_Assignments_ibfk_2` FOREIGN KEY (`driver_id`) REFERENCES `Drivers` (`driver_id`);

--
-- Constraints for table `Drivers`
--
ALTER TABLE `Drivers`
  ADD CONSTRAINT `Drivers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `Employees`
--
ALTER TABLE `Employees`
  ADD CONSTRAINT `Employees_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `Employees_ibfk_2` FOREIGN KEY (`restaurant_id`) REFERENCES `Restaurants` (`restaurant_id`) ON DELETE CASCADE;

--
-- Constraints for table `Favorite_Restaurants`
--
ALTER TABLE `Favorite_Restaurants`
  ADD CONSTRAINT `Favorite_Restaurants_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `Customers` (`customer_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `Favorite_Restaurants_ibfk_2` FOREIGN KEY (`restaurant_id`) REFERENCES `Restaurants` (`restaurant_id`) ON DELETE CASCADE;

--
-- Constraints for table `Menu_Categories`
--
ALTER TABLE `Menu_Categories`
  ADD CONSTRAINT `Menu_Categories_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `Restaurants` (`restaurant_id`) ON DELETE CASCADE;

--
-- Constraints for table `Menu_Items`
--
ALTER TABLE `Menu_Items`
  ADD CONSTRAINT `Menu_Items_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `Restaurants` (`restaurant_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `Menu_Items_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `Menu_Categories` (`category_id`) ON DELETE SET NULL;

--
-- Constraints for table `Menu_Item_Inventory`
--
ALTER TABLE `Menu_Item_Inventory`
  ADD CONSTRAINT `Menu_Item_Inventory_ibfk_1` FOREIGN KEY (`menu_item_id`) REFERENCES `Menu_Items` (`menu_item_id`) ON DELETE CASCADE;

--
-- Constraints for table `Menu_Item_Reviews`
--
ALTER TABLE `Menu_Item_Reviews`
  ADD CONSTRAINT `Menu_Item_Reviews_ibfk_1` FOREIGN KEY (`order_item_id`) REFERENCES `Order_Items` (`order_item_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `Menu_Item_Reviews_ibfk_2` FOREIGN KEY (`menu_item_id`) REFERENCES `Menu_Items` (`menu_item_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `Menu_Item_Reviews_ibfk_3` FOREIGN KEY (`customer_id`) REFERENCES `Customers` (`customer_id`);

--
-- Constraints for table `Notifications`
--
ALTER TABLE `Notifications`
  ADD CONSTRAINT `Notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `Orders`
--
ALTER TABLE `Orders`
  ADD CONSTRAINT `Orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `Customers` (`customer_id`),
  ADD CONSTRAINT `Orders_ibfk_2` FOREIGN KEY (`restaurant_id`) REFERENCES `Restaurants` (`restaurant_id`),
  ADD CONSTRAINT `Orders_ibfk_3` FOREIGN KEY (`delivery_address_id`) REFERENCES `Customer_Addresses` (`address_id`),
  ADD CONSTRAINT `Orders_ibfk_4` FOREIGN KEY (`cancelled_by`) REFERENCES `Users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `Order_Items`
--
ALTER TABLE `Order_Items`
  ADD CONSTRAINT `Order_Items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `Orders` (`order_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `Order_Items_ibfk_2` FOREIGN KEY (`menu_item_id`) REFERENCES `Menu_Items` (`menu_item_id`);

--
-- Constraints for table `Order_Status_History`
--
ALTER TABLE `Order_Status_History`
  ADD CONSTRAINT `Order_Status_History_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `Orders` (`order_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `Order_Status_History_ibfk_2` FOREIGN KEY (`changed_by`) REFERENCES `Users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `Payments`
--
ALTER TABLE `Payments`
  ADD CONSTRAINT `Payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `Orders` (`order_id`) ON DELETE CASCADE;

--
-- Constraints for table `Restaurants`
--
ALTER TABLE `Restaurants`
  ADD CONSTRAINT `Restaurants_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `Users` (`user_id`);

--
-- Constraints for table `Reviews`
--
ALTER TABLE `Reviews`
  ADD CONSTRAINT `Reviews_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `Orders` (`order_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `Reviews_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `Customers` (`customer_id`),
  ADD CONSTRAINT `Reviews_ibfk_3` FOREIGN KEY (`restaurant_id`) REFERENCES `Restaurants` (`restaurant_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
