FoodEase - Food Ordering Platform
=================================

This guide explains how to set up and run the FoodEase project on a new machine.

PREREQUISITES
-------------
1. Node.js (v16 or higher) installed.
2. MySQL Server installed and running.

STEP 1: DATABASE SETUP
----------------------
1. Open your MySQL client (Workbench, Command Line, etc.).
2. Create a new database named 'foodease':
   CREATE DATABASE foodease;

3. Import the database files in the following order from the 'database' folder:
   - 01_tables_minimal.sql
   - 02_triggers_minimal.sql
   - 03_procedures_streamlined.sql
   - 04_views_indexes_minimal.sql
   - 05_sample_data_minimal.sql

   Note: You can run these SQL files one by one in your MySQL tool.

STEP 2: BACKEND SETUP
---------------------
1. Open a terminal and navigate to the 'backend' folder:
   cd backend

2. Install dependencies:
   npm install

3. Configure Database Credentials:
   - Create a new file named '.env' in the 'backend' folder.
   - Add the following content, replacing 'YOUR_PASSWORD' with your actual MySQL password:

     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=YOUR_PASSWORD
     DB_NAME=foodease
     JWT_SECRET=your_jwt_secret_key_here
     PORT=3000

4. Start the backend server:
   npm run dev

   You should see: "Server running on port 3000" and "Database connected successfully".

STEP 3: FRONTEND SETUP
----------------------
1. Open a NEW terminal window (keep the backend running).
2. Navigate to the 'frontend' folder:
   cd frontend

3. Install dependencies:
   npm install

4. Start the frontend application:
   npm run dev

5. Open your browser and visit the URL shown (usually http://localhost:5173).

DEMO ACCOUNTS
-------------
- Admin:            admin@foodease.com    / Hamza1234
- Restaurant Owner: owner@foodease.com    / Hamza1234
- Driver:           driver@foodease.com   / Hamza1234
- Customer:         customer@foodease.com / Hamza1234
