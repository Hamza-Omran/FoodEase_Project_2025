const pool = require('../config/db');

module.exports = {
  placeOrder: async (customerId, restaurantId, addressId, specialInstructions, paymentMethod, couponCode) => {
    console.log('📝 Calling sp_place_order with:', {
      customerId,
      restaurantId,
      addressId,
      specialInstructions,
      paymentMethod,
      couponCode
    });

    await pool.query(
      'CALL sp_place_order(?, ?, ?, ?, ?, ?)',
      [customerId, restaurantId, addressId, specialInstructions, paymentMethod, couponCode]
    );

    console.log('✅ Stored procedure completed successfully');

    // Fetch latest order for this customer/restaurant to avoid race
    const [orders] = await pool.query(
      `SELECT 
         o.*,
         r.name as restaurant_name,
         ca.street_address as delivery_address,
         ca.city,
         ca.state
       FROM Orders o
       JOIN Restaurants r ON o.restaurant_id = r.restaurant_id
       JOIN Customer_Addresses ca ON o.delivery_address_id = ca.address_id
       WHERE o.customer_id = ? AND o.restaurant_id = ?
       ORDER BY o.order_id DESC 
       LIMIT 1`,
      [customerId, restaurantId]
    );

    if (!orders[0]) {
      throw new Error('Order was created but could not be retrieved');
    }

    const order = orders[0];
    console.log('📦 Order retrieved after sp_place_order:', order.order_id, order.order_number);

    const [items] = await pool.query(
      `SELECT 
         oi.order_item_id,
         oi.menu_item_id,
         oi.menu_item_name,
         oi.quantity,
         oi.unit_price,
         oi.subtotal,
         oi.special_requests
       FROM Order_Items oi
       WHERE oi.order_id = ?`,
      [order.order_id]
    );

    console.log(`📋 Order has ${items.length} items after creation`);

    return { ...order, items };
  },

  listByUser: async (customerId) => {
    const [rows] = await pool.query(
      `SELECT o.*, r.name as restaurant_name 
       FROM Orders o 
       JOIN Restaurants r ON o.restaurant_id = r.restaurant_id 
       WHERE o.customer_id = ? 
       ORDER BY o.order_date DESC`,
      [customerId]
    );
    return rows;
  },

  get: async (id) => {
    console.log('📦 Fetching order from DB, ID:', id);
    
    const [orders] = await pool.query(
      `SELECT 
         o.*,
         r.name AS restaurant_name,
         ca.street_address,
         ca.city,
         ca.state,
         ca.address_label,
         ca.postal_code,
         ca.country
       FROM Orders o
       JOIN Restaurants r ON o.restaurant_id = r.restaurant_id
       JOIN Customer_Addresses ca ON o.delivery_address_id = ca.address_id
       WHERE o.order_id = ?`,
      [id]
    );
    
    if (!orders[0]) {
      console.log('❌ Order not found');
      return null;
    }
    
    console.log('✅ Order found:', orders[0].order_number);
    
    const [items] = await pool.query(
      `SELECT 
        oi.order_item_id,
        oi.menu_item_id,
        oi.menu_item_name,
        oi.quantity,
        oi.unit_price,
        oi.subtotal,
        oi.special_requests
       FROM Order_Items oi
       WHERE oi.order_id = ?`,
      [id]
    );
    
    console.log(`📝 Found ${items.length} order items:`, items);
    
    if (items.length === 0) {
      console.warn('⚠️ WARNING: Order has no items! This may indicate a problem with order creation.');
    }
    
    return { ...orders[0], items };
  },

  // NEW: get order for tracking, supports numeric id or order_number
  getForTracking: async (idOrNumber) => {
    console.log('📦 getForTracking called with:', idOrNumber);

    const isNumericId = /^[0-9]+$/.test(String(idOrNumber));

    const [orders] = await pool.query(
      `SELECT 
         o.*,
         r.name AS restaurant_name,
         ca.street_address,
         ca.city,
         ca.state,
         ca.address_label,
         ca.postal_code,
         ca.country
       FROM Orders o
       JOIN Restaurants r ON o.restaurant_id = r.restaurant_id
       JOIN Customer_Addresses ca ON o.delivery_address_id = ca.address_id
       WHERE ${isNumericId ? 'o.order_id = ?' : 'o.order_number = ?'}
       LIMIT 1`,
      [idOrNumber]
    );

    if (!orders[0]) {
      console.log('❌ getForTracking: order not found');
      return null;
    }

    const order = orders[0];
    console.log('✅ getForTracking: order found:', order.order_id, order.order_number);

    const [items] = await pool.query(
      `SELECT 
         oi.order_item_id,
         oi.menu_item_id,
         oi.menu_item_name,
         oi.quantity,
         oi.unit_price,
         oi.subtotal,
         oi.special_requests
       FROM Order_Items oi
       WHERE oi.order_id = ?`,
      [order.order_id]
    );

    console.log(`📝 getForTracking: found ${items.length} items for order ${order.order_id}`);

    return { ...order, items };
  },

  updateStatus: async (id, status, userId, reason) => {
    await pool.query(
      'CALL sp_update_order_status(?, ?, ?, ?)',
      [id, status, userId, reason]
    );
    return { order_id: id, status };
  }
};