#!/bin/bash

# ============================================
# Railway Database Import Script
# ============================================
# Imports FoodEase database schema and data to Railway MySQL
# 
# Railway Connection Details:
# Host: turntable.proxy.rlwy.net
# Port: 33279
# User: root
# Database: railway
# ============================================

echo "🚂 Importing FoodEase Database to Railway"
echo "=========================================="
echo ""

# Railway connection details
MYSQL_HOST="turntable.proxy.rlwy.net"
MYSQL_PORT="33279"
MYSQL_USER="root"
MYSQL_PASSWORD="AfXpYSbyxKWFmEntjZFRHUGdZqRgopxa"
MYSQL_DATABASE="railway"

# Database files directory
DB_DIR="./database"

# SQL files to import (in order)
declare -a SQL_FILES=(
    "01_tables_minimal.sql"
    "02_triggers_minimal.sql"
    "03_procedures_streamlined.sql"
    "04_views_indexes_minimal.sql"
    "05_sample_data_minimal.sql"
)

echo "📋 Files to import:"
for file in "${SQL_FILES[@]}"; do
    echo "   - $file"
done
echo ""

# Import each SQL file
for SQL_FILE in "${SQL_FILES[@]}"; do
    echo "📤 Importing: $SQL_FILE"
    
    mysql -h "$MYSQL_HOST" \
          --port "$MYSQL_PORT" \
          -u "$MYSQL_USER" \
          -p"$MYSQL_PASSWORD" \
          --protocol=TCP \
          "$MYSQL_DATABASE" < "$DB_DIR/$SQL_FILE" 2>&1
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Success!"
    else
        echo "   ❌ Failed to import $SQL_FILE"
        echo "   Please check error messages above"
        exit 1
    fi
    echo ""
done

echo "🎉 Database import complete!"
echo ""
echo "✅ Verify in Railway:"
echo "   1. Go to Railway MySQL service"
echo "   2. Click 'Data' tab"
echo "   3. You should see 11 tables"
echo ""
echo "📊 Expected tables:"
echo "   - Users"
echo "   - Customers"
echo "   - Customer_Addresses"
echo "   - Restaurants"
echo "   - Drivers"
echo "   - Menu_Categories"
echo "   - Menu_Items"
echo "   - Orders"
echo "   - Order_Items"
echo "   - Delivery_Assignments"
echo "   - Cart_Items"
echo "   - Favorite_Restaurants"
echo "   - Restaurant_Reviews"
echo "   - Menu_Item_Reviews"
echo ""
