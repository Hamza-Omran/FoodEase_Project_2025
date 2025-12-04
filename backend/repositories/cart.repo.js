const pool = require('../config/db');

module.exports = {
  get: async (customerId) => {
    console.log('🛒 Getting cart for customer:', customerId);
    
    const [rows] = await pool.query(
      `SELECT 
        ci.cart_item_id,
        ci.menu_item_id,
        ci.quantity,
        ci.special_requests,
        mi.name,
        mi.price,
        mi.image_url,
        mi.is_available,
        r.restaurant_id,
        r.name as restaurant_name
       FROM Cart_Items ci
       JOIN Menu_Items mi ON ci.menu_item_id = mi.menu_item_id
       JOIN Restaurants r ON ci.restaurant_id = r.restaurant_id
       WHERE ci.customer_id = ?`,
      [customerId]
    );
    
    console.log(`✅ Found ${rows.length} cart items`);
    if (rows.length > 0) {
      console.log('📦 Cart items details:', rows.map(r => ({
        id: r.cart_item_id,
        menu_item: r.name,
        restaurant: r.restaurant_name,
        available: r.is_available
      })));
    }
    
    return rows;
  },

  add: async (customerId, menuItemId, quantity, notes) => {
    try {
      // Don't use stored procedure, do it directly
      const connection = await pool.getConnection();
      
      try {
        await connection.beginTransaction();
        
        // Get restaurant_id for the menu item
        const [items] = await connection.query(
          'SELECT restaurant_id, is_available FROM Menu_Items WHERE menu_item_id = ?',
          [menuItemId]
        );
        
        if (!items[0]) {
          throw new Error('Menu item not found');
        }
        
        if (!items[0].is_available) {
          throw new Error('Menu item is not available');
        }
        
        const restaurantId = items[0].restaurant_id;
        
        // Check if cart has items from different restaurant
        const [existingCart] = await connection.query(
          'SELECT restaurant_id FROM Cart_Items WHERE customer_id = ? LIMIT 1',
          [customerId]
        );
        
        if (existingCart.length > 0 && existingCart[0].restaurant_id !== restaurantId) {
          throw new Error('Cannot add items from different restaurants. Clear cart first.');
        }
        
        // Insert or update cart item
        await connection.query(
          `INSERT INTO Cart_Items (customer_id, restaurant_id, menu_item_id, quantity, special_requests)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
             quantity = quantity + VALUES(quantity),
             special_requests = VALUES(special_requests),
             updated_at = CURRENT_TIMESTAMP`,
          [customerId, restaurantId, menuItemId, quantity, notes]
        );
        
        await connection.commit();
        return { success: true };
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      throw error;
    }
  },

  update: async (customerId, cartItemId, quantity) => {
    await pool.query(
      'UPDATE Cart_Items SET quantity = ? WHERE cart_item_id = ? AND customer_id = ?',
      [quantity, cartItemId, customerId]
    );
  },

  remove: async (customerId, cartItemId) => {
    await pool.query(
      'DELETE FROM Cart_Items WHERE cart_item_id = ? AND customer_id = ?',
      [cartItemId, customerId]
    );
  },

  clear: async (customerId) => {
    await pool.query('DELETE FROM Cart_Items WHERE customer_id = ?', [customerId]);
  }
};