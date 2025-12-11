-- --------------------------------------------------------
-- Sakay Bravo Schema —  ALL IDs as VARCHAR 
-- For userID:
-- Admin - A001st
-- Driver - D001
-- Passenger - P001
-- --------------------------------------------------------

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------
-- USERS (Main Entity)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `userID` VARCHAR(20) PRIMARY KEY,       -- A001, D001, P001
  `first_name` VARCHAR(50) NOT NULL,
  `last_name` VARCHAR(50) NOT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `profile_pic` VARCHAR(500) DEFAULT NULL,
  `role` ENUM('admin','driver','passenger') DEFAULT 'passenger',
  `status` ENUM('active','suspended','pending_verification','deactivated') DEFAULT 'pending_verification',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login` DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- ADMIN (Specialized Entity)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `admin`;
CREATE TABLE `admin` (
  `adminID` VARCHAR(20) PRIMARY KEY,
  `admin_level` ENUM('super','admin') DEFAULT 'admin',
  FOREIGN KEY (`adminID`) REFERENCES `users`(`userID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- DRIVER (Specialized Entity)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `driver`;
CREATE TABLE `driver` (
  `driverID` VARCHAR(20) PRIMARY KEY,
  `license_number` VARCHAR(50) NOT NULL UNIQUE,
  `license_expiry` DATE NOT NULL,
  `license_image` VARCHAR(500) DEFAULT NULL,
  `license_type` VARCHAR(20) DEFAULT NULL,
  `license_status` ENUM('unsubmitted','for_review','verified','expired','suspended','revoked','rejected') DEFAULT 'for_review',
  `verified_by` VARCHAR(20) DEFAULT NULL,
  `verified_at` DATETIME DEFAULT NULL,
  `total_rides` INT DEFAULT 0,
  `average_rating` DECIMAL(3,2) DEFAULT 0.00,
  FOREIGN KEY (`driverID`) REFERENCES `users`(`userID`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`verified_by`) REFERENCES `users`(`userID`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- PASSENGER (Specialized Entity)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `passenger`;
CREATE TABLE `passenger` (
  `passengerID` VARCHAR(20) PRIMARY KEY,
  `preferred_payment` ENUM('cash','gcash','maya','debit','credit') DEFAULT 'cash',
   `total_rides` INT DEFAULT 0,
   `verified_by` VARCHAR(20) DEFAULT NULL,  
  `verified_at` DATETIME DEFAULT NULL,  
  FOREIGN KEY (`passengerID`) REFERENCES `users`(`userID`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`verified_by`) REFERENCES `users`(`userID`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- VEHICLES
-- --------------------------------------------------------
DROP TABLE IF EXISTS `vehicles`;
CREATE TABLE `vehicles` (
  `vehicleID` VARCHAR(20) PRIMARY KEY,        -- e.g. V001
  `driverID` VARCHAR(20) NOT NULL,
  `brand` VARCHAR(50) DEFAULT NULL,
  `model` VARCHAR(50) DEFAULT NULL,
  `plate_number` VARCHAR(20) UNIQUE,
  `color` VARCHAR(30) DEFAULT NULL,
   `year` YEAR DEFAULT NULL,
  `seats_available` INT DEFAULT 4,
  `OR_CR` VARCHAR(500) DEFAULT NULL,
  `vehicle_status` ENUM(
    'active', 
    'expired',      
    'for_renewal',           
    'renewed',  
    'rejected',               
    'cancelled'              
  ) DEFAULT 'active',
  `verified_by` VARCHAR(20) DEFAULT NULL,
  `verified_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`driverID`) REFERENCES `driver`(`driverID`) ON DELETE CASCADE,
FOREIGN KEY (`verified_by`) REFERENCES `users`(`userID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- RIDES
-- --------------------------------------------------------
DROP TABLE IF EXISTS `rides`;
CREATE TABLE `rides` (
  `rideID` VARCHAR(20) PRIMARY KEY,          -- e.g. R001
  `userID` VARCHAR(20) NOT NULL,    -- a driver can be a passenger as well and vice versa
  `vehicleID` VARCHAR(20) NOT NULL,
  `origin` VARCHAR(500) NOT NULL,
  `destination` VARCHAR(500) NOT NULL,
  `departure_time` DATETIME NOT NULL,
  `estimated_arrival` DATETIME DEFAULT NULL,
  `total_seats` INT NOT NULL,
  `status` ENUM(
    'posted',            -- ride is posted / waiting for driver
    'accepted',        -- driver accepted the ride
    'waiting_pickup',
    'en_route',        -- driver is on the way to pickup point
    'ongoing',         -- passenger has been picked up
    'completed',       -- trip is successfully finished
    'cancelled',       -- cancelled by passenger or driver
    'no_show',       -- passenger did not show up
    'driver_cancelled',
    'passenger_cancelled'
  ) DEFAULT 'posted',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`userID`) REFERENCES `users`(`userID`) ON DELETE CASCADE,
  FOREIGN KEY (`vehicleID`) REFERENCES `vehicles`(`vehicleID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- BOOKINGS
-- --------------------------------------------------------
DROP TABLE IF EXISTS `bookings`;
CREATE TABLE `bookings` (
  `bookingID` VARCHAR(20) PRIMARY KEY,      -- e.g. B001
  `rideID` VARCHAR(20) NOT NULL,
  `userID` VARCHAR(20) NOT NULL,   -- a driver can be a passenger as well and vice versa
  `seats_booked` INT DEFAULT 1,
  `total_fare` DECIMAL(10,2) NOT NULL,
   `pickup_location` VARCHAR(200) DEFAULT NULL,
  `dropoff_location` VARCHAR(200) DEFAULT NULL,
  `payment_status` ENUM(
    'pending',      -- booking made but not yet paid
    'paid',         -- payment completed
    'refunded',     -- optional: if ride is cancelled after payment
    'failed',       -- optional: if payment didn’t push through
    'cancelled',     -- optional: if booking itself was cancelled before payment
    'partial'       -- Payment partially completed (for split payments or deposits).
  ) DEFAULT 'pending',
  `booking_status` ENUM(
    'requested',    -- passenger created the booking
    'confirmed',    -- driver accepted the booking
    'ongoing',  -- driver and passenger are on the trip
    'completed',    -- trip successfully finished
    'cancelled',    -- passenger or driver cancelled
    'no_show',       -- passenger didn’t show up
    'driver_cancelled', -- Driver cancelled before or during pickup.
    'passenger_cancelled' -- Passenger cancelled the booking.
  ) DEFAULT 'requested',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`rideID`) REFERENCES `rides`(`rideID`) ON DELETE CASCADE,
  FOREIGN KEY (`userID`) REFERENCES `users`(`userID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
       
-- --------------------------------------------------------
-- PAYMENT
-- --------------------------------------------------------
DROP TABLE IF EXISTS `payment`;
CREATE TABLE `payment` (
  `paymentID` VARCHAR(20) PRIMARY KEY,      -- e.g. PAY001
  `bookingID` VARCHAR(20) NOT NULL,
  `payment_method` ENUM('cash','gcash','maya','debit','credit') DEFAULT 'cash',
  `amount` DECIMAL(10,2) NOT NULL,
  `status` ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
  `payment_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `transaction_reference` VARCHAR(100) DEFAULT NULL,
  FOREIGN KEY (`bookingID`) REFERENCES `bookings`(`bookingID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- RATINGS
-- --------------------------------------------------------
DROP TABLE IF EXISTS `ratings`;
CREATE TABLE `ratings` (
  `ratingID` VARCHAR(20) PRIMARY KEY,       -- e.g. RATE001
  `rideID` VARCHAR(20) NOT NULL,
  `bookingID` VARCHAR(20) NOT NULL,
  `passengerID` VARCHAR(20) NOT NULL,
  `driverID` VARCHAR(20) NOT NULL,
  `rating` TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  `comment` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`rideID`) REFERENCES `rides`(`rideID`) ON DELETE CASCADE,
  FOREIGN KEY (`bookingID`) REFERENCES `bookings`(`bookingID`) ON DELETE CASCADE,
  FOREIGN KEY (`passengerID`) REFERENCES `passenger`(`passengerID`) ON DELETE CASCADE,
  FOREIGN KEY (`driverID`) REFERENCES `driver`(`driverID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- REPORTS
-- --------------------------------------------------------
DROP TABLE IF EXISTS `reports`;
CREATE TABLE `reports` (
  `reportID` VARCHAR(20) PRIMARY KEY,       -- e.g. REP001
   `reporter_userID` VARCHAR(20) DEFAULT NULL,
  `reported_userID` VARCHAR(20) DEFAULT NULL,
   `report_type` ENUM('driver_issue','passenger_issue','payment_issue','safety_concern','vehicle_issue','other') DEFAULT 'other',
  `subject` VARCHAR(200) NOT NULL,
  `rideID` VARCHAR(20) DEFAULT NULL,
  `description` TEXT NOT NULL,
  `handled_by` VARCHAR(20) DEFAULT NULL,
  `status` ENUM('pending','reviewed','resolved') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` DATETIME DEFAULT NULL,
FOREIGN KEY (`reporter_userID`) REFERENCES `users`(`userID`) ON DELETE SET NULL,
  FOREIGN KEY (`reported_userID`) REFERENCES `users`(`userID`) ON DELETE SET NULL,
  FOREIGN KEY (`rideID`) REFERENCES `rides`(`rideID`) ON DELETE SET NULL,
  FOREIGN KEY (`handled_by`) REFERENCES `admin`(`adminID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- SYSTEM SETTINGS (Admin Configuration)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `system_settings`;
CREATE TABLE `system_settings` (
  `settingID` VARCHAR(20) PRIMARY KEY,
  `setting_key` VARCHAR(100) NOT NULL UNIQUE,
  `setting_value` TEXT NOT NULL,
  `setting_type` ENUM('text','number','boolean','json') DEFAULT 'text',
  `description` TEXT DEFAULT NULL,
  `updated_by` VARCHAR(20) DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`updated_by`) REFERENCES `admin`(`adminID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- LOGS
-- --------------------------------------------------------
DROP TABLE IF EXISTS `logs`;
CREATE TABLE `logs` (
  `logID` VARCHAR(20) PRIMARY KEY,          -- e.g. LOG001
  `userID` VARCHAR(20) DEFAULT NULL,
  `action` VARCHAR(255) NOT NULL,
   `module` VARCHAR(50) DEFAULT NULL,
   `details` TEXT DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` TEXT DEFAULT NULL,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`userID`) REFERENCES `users`(`userID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- USER TOKENS (JWT or API Authentication)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `user_tokens`;
CREATE TABLE `user_tokens` (
  `tokenID` VARCHAR(20) PRIMARY KEY,        -- e.g. TKN001
  `userID` VARCHAR(20) NOT NULL,
  `role` ENUM('admin','driver','passenger') NOT NULL,
  `token` VARCHAR(500) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `revoked` TINYINT(1) DEFAULT 0,
  FOREIGN KEY (`userID`) REFERENCES `users`(`userID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- SESSIONS (for PHP session-based login)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (
  `sessionID` VARCHAR(20) PRIMARY KEY,           -- e.g. S001
  `userID` VARCHAR(20) NOT NULL,
  `role` ENUM('admin','driver','passenger'),
  `ip_address` VARCHAR(45),
  `user_agent` TEXT,
  `last_activity` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expires_at` DATETIME NOT NULL,
  FOREIGN KEY (`userID`) REFERENCES `users`(`userID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- CONTACT US
-- --------------------------------------------------------
DROP TABLE IF EXISTS `contact_us`;
CREATE TABLE `contact_us` (
  `messageID` VARCHAR(20) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `message` text NOT NULL,
   `status` ENUM('new','read','replied') DEFAULT 'new',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`messageID`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- DEFAULT SYSTEM SETTINGS
-- --------------------------------------------------------
INSERT INTO `system_settings` (`settingID`, `setting_key`, `setting_value`, `setting_type`, `description`) VALUES
('SET001', 'base_fare', '40.00', 'number', 'Base fare for all rides (PHP)'),
('SET002', 'per_km_rate', '10.00', 'number', 'Rate per kilometer (PHP)'),
('SET003', 'platform_commission', '10', 'number', 'Platform commission percentage'),
('SET004', 'surge_multiplier', '1.5', 'number', 'Surge pricing multiplier'),
('SET005', 'max_booking_advance_days', '7', 'number', 'Maximum days in advance for booking'),
('SET006', 'cancellation_fee', '20.00', 'number', 'Fee for cancelling confirmed bookings'),
('SET007', 'app_name', 'SakayBravo', 'text', 'Application name'),
('SET008', 'contact_email', 'support@sakaybravo.com', 'text', 'Support email address'),
('SET009', 'enable_notifications', 'true', 'boolean', 'Enable system notifications');

-- --------------------------------------------------------
-- SEED SUPER ADMIN USER
-- Execute this script ONCE after creating your database
-- This creates the initial super admin account
-- --------------------------------------------------------

-- Insert Super Admin into users table
INSERT INTO `users` (
    `userID`, 
    `first_name`, 
    `last_name`, 
    `email`, 
    `phone`,
    `password_hash`, 
    `role`, 
    `status`, 
    `created_at`,
    `last_login`
) VALUES (
    'A001',
    'Sakay',
    'Bravo',
    'sakaybravo@slu.edu.ph',
    '09773554210',
    '$2y$10$PB6CLjneTMnjoh7.XbytGu/XMIJJhLt7nvOM.KqZTRJ790KiP9jUq',
    'admin',
    'active',
    NOW(),
    NULL
);

-- Insert into admin table with super level
INSERT INTO `admin` (
    `adminID`,
    `admin_level`
) VALUES (
    'A001',
    'super'
);


COMMIT;
