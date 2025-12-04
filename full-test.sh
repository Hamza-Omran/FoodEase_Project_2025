#!/bin/bash
# filepath: /home/hamza/All Data To Transfer/VIF/Materials/Fourth Year/1st term/Web Programming/Project/Project v2/FoodEase_Project_2025/full-test.sh

BASE_URL="http://localhost:3000/api/v1"

# Generate unique timestamp for emails
TIMESTAMP=$(date +%s)

echo "════════════════════════════════════════"
echo "    FoodEase Backend API Tests"
echo "    Run ID: $TIMESTAMP"
echo "════════════════════════════════════════"

# Test 1: Health Check
echo -e "\n1️⃣  Health Check..."
curl -s $BASE_URL/health | jq '.'

# Test 2: Register Customer
echo -e "\n2️⃣  Registering customer..."
CUSTOMER_EMAIL="customer_${TIMESTAMP}@test.com"
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Customer\",
    \"email\": \"$CUSTOMER_EMAIL\",
    \"password\": \"password123\",
    \"role\": \"customer\"
  }")

echo $REGISTER_RESPONSE | jq '.'
CUSTOMER_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.token')
CUSTOMER_ID=$(echo $REGISTER_RESPONSE | jq -r '.user.id')

if [ "$CUSTOMER_TOKEN" != "null" ] && [ -n "$CUSTOMER_TOKEN" ]; then
    echo "✅ Customer registered with ID: $CUSTOMER_ID"
    echo "✅ Token: ${CUSTOMER_TOKEN:0:30}..."
    
    # Test 3: Get Current User
    echo -e "\n3️⃣  Getting current user (protected route)..."
    curl -s $BASE_URL/auth/me \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" | jq '.'
    
    # Test 4: Get Restaurants
    echo -e "\n4️⃣  Getting all restaurants..."
    curl -s $BASE_URL/restaurants | jq '.'
    
else
    echo "❌ Failed to register customer"
    echo "Response: $REGISTER_RESPONSE"
    exit 1
fi

# Test 5: Register Restaurant Owner
echo -e "\n5️⃣  Registering restaurant owner..."
OWNER_EMAIL="owner_${TIMESTAMP}@test.com"
OWNER_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Restaurant Owner\",
    \"email\": \"$OWNER_EMAIL\",
    \"password\": \"password123\",
    \"role\": \"restaurant_owner\"
  }")

echo $OWNER_RESPONSE | jq '.'
OWNER_TOKEN=$(echo $OWNER_RESPONSE | jq -r '.token')

if [ "$OWNER_TOKEN" != "null" ] && [ -n "$OWNER_TOKEN" ]; then
    echo "✅ Owner token received: ${OWNER_TOKEN:0:30}..."
    
    # Test 6: Create Restaurant
    echo -e "\n6️⃣  Creating restaurant..."
    REST_RESPONSE=$(curl -s -X POST $BASE_URL/restaurants \
      -H "Authorization: Bearer $OWNER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Pizza Palace Test",
        "street_address": "123 Main St",
        "city": "Cairo",
        "description": "Best pizza in town",
        "cuisine_type": "Italian",
        "phone": "01234567890"
      }')
    
    echo $REST_RESPONSE | jq '.'
    RESTAURANT_ID=$(echo $REST_RESPONSE | jq -r '.restaurant_id')
    
    if [ "$RESTAURANT_ID" != "null" ] && [ -n "$RESTAURANT_ID" ]; then
        echo "✅ Restaurant created with ID: $RESTAURANT_ID"
        
        # Test 7: Create Menu Category
        echo -e "\n7️⃣  Creating menu category..."
        CAT_RESPONSE=$(curl -s -X POST $BASE_URL/restaurants/$RESTAURANT_ID/categories \
          -H "Authorization: Bearer $OWNER_TOKEN" \
          -H "Content-Type: application/json" \
          -d '{
            "restaurant_id": '$RESTAURANT_ID',
            "name": "Pizza",
            "description": "Delicious pizzas"
          }')
        
        echo $CAT_RESPONSE | jq '.'
        CATEGORY_ID=$(echo $CAT_RESPONSE | jq -r '.category_id')
        echo "✅ Category created with ID: $CATEGORY_ID"
        
        # Test 8: Add Menu Item
        echo -e "\n8️⃣  Adding menu item..."
        MENU_RESPONSE=$(curl -s -X POST $BASE_URL/restaurants/$RESTAURANT_ID/menu \
          -H "Authorization: Bearer $OWNER_TOKEN" \
          -H "Content-Type: application/json" \
          -d "{
            \"name\": \"Margherita Pizza\",
            \"description\": \"Classic Italian pizza\",
            \"price\": 89.99,
            \"category_id\": $CATEGORY_ID
          }")
        
        echo $MENU_RESPONSE | jq '.'
        MENU_ITEM_ID=$(echo $MENU_RESPONSE | jq -r '.menu_item_id')
        
        # Test 9: Get Menu Items
        echo -e "\n9️⃣  Getting menu items..."
        curl -s $BASE_URL/restaurants/$RESTAURANT_ID/menu | jq '.'
        
        if [ "$MENU_ITEM_ID" != "null" ] && [ -n "$MENU_ITEM_ID" ]; then
            # Test 10: Add Customer Address
            echo -e "\n🔟 Adding customer address..."
            ADDR_RESPONSE=$(curl -s -X POST $BASE_URL/customers/$CUSTOMER_ID/addresses \
              -H "Authorization: Bearer $CUSTOMER_TOKEN" \
              -H "Content-Type: application/json" \
              -d '{
                "street_address": "456 Test St",
                "city": "Cairo",
                "state": "Cairo",
                "postal_code": "12345",
                "country": "Egypt",
                "is_default": true
              }')
            
            echo $ADDR_RESPONSE | jq '.'
            ADDRESS_ID=$(echo $ADDR_RESPONSE | jq -r '.address_id')
            echo "✅ Address added with ID: $ADDRESS_ID"
            
            # Test 11: Add to Cart
            echo -e "\n1️⃣1️⃣  Adding item to cart..."
            curl -s -X POST $BASE_URL/cart/add \
              -H "Authorization: Bearer $CUSTOMER_TOKEN" \
              -H "Content-Type: application/json" \
              -d "{
                \"menu_item_id\": $MENU_ITEM_ID,
                \"quantity\": 2,
                \"notes\": \"Extra cheese\"
              }" | jq '.'
            
            # Test 12: View Cart
            echo -e "\n1️⃣2️⃣  Viewing cart..."
            curl -s $BASE_URL/cart \
              -H "Authorization: Bearer $CUSTOMER_TOKEN" | jq '.'
            
            # Test 13: Place Order
            echo -e "\n1️⃣3️⃣  Placing order..."
            ORDER_RESPONSE=$(curl -s -X POST $BASE_URL/orders \
              -H "Authorization: Bearer $CUSTOMER_TOKEN" \
              -H "Content-Type: application/json" \
              -d "{
                \"restaurant_id\": $RESTAURANT_ID,
                \"address_id\": $ADDRESS_ID,
                \"payment_method\": \"cash\",
                \"special_instructions\": \"Ring doorbell\"
              }")
            
            echo $ORDER_RESPONSE | jq '.'
            ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '.order_id')
            
            if [ "$ORDER_ID" != "null" ] && [ -n "$ORDER_ID" ]; then
                echo "✅ Order placed with ID: $ORDER_ID"
                
                # Test 14: View Orders
                echo -e "\n1️⃣4️⃣  Viewing customer orders..."
                curl -s $BASE_URL/orders \
                  -H "Authorization: Bearer $CUSTOMER_TOKEN" | jq '.'
                
                # Test 15: Update Order Status
                echo -e "\n1️⃣5️⃣  Updating order status to confirmed..."
                curl -s -X PUT $BASE_URL/orders/status/$ORDER_ID \
                  -H "Authorization: Bearer $OWNER_TOKEN" \
                  -H "Content-Type: application/json" \
                  -d '{
                    "status": "confirmed"
                  }' | jq '.'
            fi
        fi
    fi
fi

echo -e "\n════════════════════════════════════════"
echo "    ✅ All Tests Completed!"
echo "    📊 Test Summary:"
echo "    - Customer: $CUSTOMER_EMAIL"
echo "    - Owner: $OWNER_EMAIL"
echo "    - Restaurant ID: $RESTAURANT_ID"
echo "    - Order ID: $ORDER_ID"
echo "════════════════════════════════════════"