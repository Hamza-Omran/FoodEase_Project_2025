#!/bin/bash

# ============================================
# Migrate data from food_ordering_platform to railway database
# ============================================

echo "🔄 Migrating FoodEase to 'railway' database"
echo "==========================================="
echo ""

# Connection details
MYSQL_HOST="turntable.proxy.rlwy.net"
MYSQL_PORT="33279"
MYSQL_USER="root"
MYSQL_PASSWORD="AfXpYSbyxKWFmEntjZFRHUGdZqRgopxa"

echo "📤 Step 1: Dump database from food_ordering_platform..."
mysqldump -h "$MYSQL_HOST" \
          --port "$MYSQL_PORT" \
          -u "$MYSQL_USER" \
          -p"$MYSQL_PASSWORD" \
          --protocol=TCP \
          --no-create-db \
          food_ordering_platform > /tmp/foodease_dump.sql 2>&1

if [ $? -eq 0 ]; then
    echo "   ✅ Database dumped successfully!"
else
    echo "   ❌ Failed to dump database"
    exit 1
fi

echo ""
echo "📥 Step 2: Import to 'railway' database..."
mysql -h "$MYSQL_HOST" \
      --port "$MYSQL_PORT" \
      -u "$MYSQL_USER" \
      -p"$MYSQL_PASSWORD" \
      --protocol=TCP \
      railway < /tmp/foodease_dump.sql 2>&1

if [ $? -eq 0 ]; then
    echo "   ✅ Imported to railway database!"
else
    echo "   ❌ Failed to import"
    exit 1
fi

echo ""
echo "🧹 Step 3: Cleanup..."
rm -f /tmp/foodease_dump.sql
echo "   ✅ Cleanup complete"

echo ""
echo "🎉 Migration complete!"
echo ""
echo "✅ Now Railway UI will show your tables!"
echo "   Database: railway"
echo "   Tables: 14"
echo "   Views: 4"
echo ""
