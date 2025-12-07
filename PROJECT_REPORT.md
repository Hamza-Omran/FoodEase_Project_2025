# FoodEase Project Report

**Date:** December 6, 2025  
**Version:** 2.0  

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Database Design](#3-database-design)
4. [Backend API Documentation](#4-backend-api-documentation)
5. [Frontend Structure & Integration](#5-frontend-structure--integration)
6. [User Roles & Workflows](#6-user-roles--workflows)
7. [Key Features Implementation](#7-key-features-implementation)
8. [Conclusion](#8-conclusion)

---

## 1. Project Overview

**FoodEase** is a comprehensive web-based food delivery platform designed to connect customers, restaurants, and delivery drivers in a seamless ecosystem. The application facilitates the entire food ordering process, from browsing menus and placing orders to real-time tracking and delivery management.

### Core Objectives
- **For Customers:** Provide a user-friendly interface to discover restaurants, browse menus, customize orders, and track deliveries in real-time.
- **For Restaurants:** Offer a robust management dashboard to handle menus, incoming orders, and track business performance.
- **For Drivers:** Enable efficient delivery management with a dedicated interface for accepting and fulfilling orders.
- **For Admins:** Provide system-wide oversight to manage users, restaurants, and platform settings.

---

## 2. System Architecture

The project follows a modern **Client-Server architecture**, utilizing a RESTful API for communication between the frontend and backend.

### Technology Stack

#### Frontend (Client-Side)
- **Framework:** React.js (Vite)
- **Styling:** Tailwind CSS for responsive and utility-first design.
- **Routing:** React Router DOM for seamless single-page application (SPA) navigation.
- **State Management:** React Context API (AuthContext, CartContext, OrderContext) for global state management.
- **HTTP Client:** Axios for making API requests.

#### Backend (Server-Side)
- **Runtime:** Node.js
- **Framework:** Express.js for handling HTTP requests and routing.
- **Database Driver:** `mysql2/promise` for asynchronous database interactions.
- **Authentication:** JSON Web Tokens (JWT) for secure, stateless authentication.
- **Security:** `bcrypt` for password hashing, `cors` for cross-origin resource sharing.

#### Database
- **System:** MySQL (Relational Database Management System).
- **Features:** Utilizes Stored Procedures, Triggers, and Views for data integrity and complex business logic encapsulation.

---

## 3. Database Design

The database is normalized to ensure data integrity and minimize redundancy. It consists of the following core tables:

### Core Tables

1.  **Users:** Stores authentication details (email, password hash) and role (customer, restaurant_owner, driver, admin).
2.  **Customers:** Profile information for customers (linked to Users).
3.  **Restaurants:** Restaurant details (name, description, image, owner_id).
4.  **Menu_Items:** Food items available at each restaurant.
5.  **Orders:** Central table tracking order status, total amount, and timestamps.
6.  **Order_Items:** Individual items within an order (quantity, price, special requests).
7.  **Drivers:** Profile information for drivers (vehicle details, license).
8.  **Delivery_Assignments:** Links orders to drivers.
9.  **Restaurant_Reviews:** Stores customer ratings and reviews for orders.

### Key Relationships (ERD Summary)
- **One-to-One:** User ↔ Customer/Driver.
- **One-to-Many:** Restaurant ↔ Menu_Items.
- **One-to-Many:** Customer ↔ Orders.
- **One-to-Many:** Restaurant ↔ Orders.
- **Many-to-Many:** Orders ↔ Menu_Items (via Order_Items).

### Advanced Database Features

#### Stored Procedures
- `sp_place_order`: Handles the complex logic of creating an order, inserting items, calculating totals (including tax/delivery), and managing transactions atomically.
- `sp_update_order_status`: Manages valid status transitions (e.g., Pending → Confirmed → Preparing).

#### Triggers
- **Review Triggers:** Automatically recalculate a restaurant's average rating and review count whenever a new review is inserted, updated, or deleted. This optimizes read performance by avoiding expensive aggregation queries on every page load.

---

## 4. Backend API Documentation

The backend exposes a structured REST API grouped by resource. All API routes are prefixed with `/api/v1`.

### Authentication (`/auth`)
- `POST /register`: Register a new user (customer, restaurant owner, or driver).
- `POST /login`: Authenticate user and return JWT token.
- `GET /me`: Get current user profile.

### Restaurants (`/restaurants`)
- `GET /`: List all restaurants (with search/filter).
- `GET /:id`: Get details of a specific restaurant.
- `GET /:id/menu`: Get menu items for a restaurant.
- `POST /`: Create a new restaurant (Owner only).
- `GET /my`: Get restaurants owned by the logged-in user.

### Orders (`/orders`)
- `POST /`: Place a new order.
- `GET /`: Get order history for the logged-in customer.
- `GET /:id`: Get detailed information for a specific order.
- `PUT /status/:id`: Update order status (Owner/Admin/Driver).

### Reviews (`/reviews`)
- `POST /restaurant`: Submit a review for a delivered order.
- `GET /restaurant/:id`: Get all reviews for a specific restaurant.
- `PUT /:id`: Update an existing review.
- `DELETE /:id`: Remove a review.

### Drivers (`/drivers`)
- `GET /available/:restaurantId`: List drivers available near a restaurant.
- `POST /assign`: Assign a driver to an order.

---

## 5. Frontend Structure & Integration

The frontend is organized into a modular structure to ensure maintainability and scalability.

### Directory Structure
- `src/components/`: Reusable UI components (Header, Footer, StarRating, RestaurantCard).
- `src/pages/`: Main view components (Home, Restaurants, MyOrders, OrderDetails, AdminDashboard).
- `src/context/`: React Context providers for global state (Auth, Cart).
- `src/services/`: API service modules for handling Axios requests.

### Key Integrations

#### 1. Authentication Flow
- **Login:** The `Login` page captures credentials and calls `authAPI.login()`.
- **Token Storage:** Upon success, the JWT token is stored in `localStorage`.
- **Route Protection:** The `ProtectedRoute` component checks for a valid token and user role before rendering sensitive pages (e.g., `/admin`, `/my-orders`).

#### 2. Ordering Flow
- **Cart Management:** The `CartContext` manages the state of selected items.
- **Checkout:** The `CheckoutPage` collects delivery address and payment info.
- **Submission:** `api.post('/orders')` sends the payload to the backend, which triggers `sp_place_order`.

#### 3. Real-Time Tracking
- **Polling:** The `OrderTrackingPage` periodically fetches order status to update the progress bar (Pending → Confirmed → Preparing → Ready → Out for Delivery → Delivered).

---

## 6. User Roles & Workflows

### Customer
1.  **Registration:** Sign up as a customer.
2.  **Discovery:** Browse restaurants on the home page.
3.  **Ordering:** Add items to cart, proceed to checkout.
4.  **Tracking:** Monitor order status in real-time.
5.  **Review:** After delivery, leave a star rating and comment.

### Restaurant Owner
1.  **Management:** Log in to the Admin Dashboard.
2.  **Order Processing:** View incoming orders.
3.  **Status Updates:** Move orders from "Pending" to "Confirmed" to "Preparing" to "Ready".
4.  **Driver Assignment:** Assign available drivers to "Ready" orders.
5.  **Feedback:** View customer reviews and ratings.

### Driver
1.  **Availability:** Log in and view "Available Orders".
2.  **Delivery:** Accept orders assigned to them.
3.  **Completion:** Mark orders as "Delivered" upon arrival.

### Admin
1.  **Oversight:** View system-wide statistics (Total Orders, Revenue).
2.  **User Management:** Manage users and restaurants.

---

## 7. Key Features Implementation

### Review & Rating System
A fully integrated review system was implemented to allow customers to provide feedback.
- **Database:** `Restaurant_Reviews` table links Customers, Restaurants, and Orders.
- **Frontend:**
    - `StarRating` component for visual representation.
    - `OrderReviewPage` for submitting feedback.
    - **Admin Dashboard:** Displays a star indicator (⭐) for orders with reviews.
    - **Order Details:** Shows the full review text and rating for restaurant owners.
- **Logic:** Reviews are restricted to **delivered** orders only to ensure authenticity.

### Dynamic Dashboard
The Admin Dashboard provides a comprehensive view for restaurant owners:
- **Stats Cards:** Total Orders, Revenue, Pending, Delivered.
- **Order Table:** List of recent orders with status badges.
- **Action Buttons:** Context-aware buttons (e.g., "Confirm", "Start Preparing") that appear based on the order's current status.

---

## 8. Demo Credentials

To facilitate testing, the following pre-configured accounts are available in the system:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@foodease.com` | `Hamza1234` |
| **Restaurant Owner** | `owner@foodease.com` | `Hamza1234` |
| **Driver** | `driver@foodease.com` | `Hamza1234` |
| **Customer** | `customer@foodease.com` | `Hamza1234` |

---

## 9. Testing and Test Cases

Comprehensive testing was conducted to ensure system reliability. Below are the core test cases for the major features.

### 9.1 Authentication Testing
| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| A1 | User Registration | Enter valid email, password, role | Account created, token received | ✅ Pass |
| A2 | Login Validation | Enter invalid credentials | Error message displayed | ✅ Pass |
| A3 | Role Protection | Try to access Admin Dashboard as Customer | Redirected to Home/Login | ✅ Pass |

### 9.2 Ordering System Testing
| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| O1 | Add to Cart | Click "Add to Cart" on menu item | Item appears in cart, total updates | ✅ Pass |
| O2 | Place Order | Complete checkout with valid address | Order created, status "Pending" | ✅ Pass |
| O3 | Order Tracking | View tracking page for active order | Progress bar shows current status | ✅ Pass |

### 9.3 Restaurant Management Testing
| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| R1 | Status Update | Change order from "Pending" to "Confirmed" | Status updates in DB and Customer UI | ✅ Pass |
| R2 | Driver Assignment | Assign driver to "Ready" order | Driver receives order, status updates | ✅ Pass |
| R3 | View Reviews | Check Order Details for delivered order | Customer rating and review displayed | ✅ Pass |

### 9.4 Review System Testing
| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| V1 | Submit Review | Rate delivered order 5 stars | Review saved, Avg Rating updates | ✅ Pass |
| V2 | Prevent Duplicate | Try to review same order twice | "Review already exists" error | ✅ Pass |
| V3 | Validate Status | Try to review non-delivered order | Button hidden / Access denied | ✅ Pass |

---

## 10. Conclusion

The FoodEase project successfully implements a full-stack food delivery application. It demonstrates robust database design, secure API development, and a responsive frontend user experience. The system is scalable and covers all essential workflows for customers, restaurants, and drivers.
