const pool = require('../config/db');

class CartRepository {
    async get(customerId) {
        const { rows: items } = await pool.query(`
      SELECT 
        ci.*,
        mi.name,
        mi.price,
        mi.image_url,
        mi.restaurant_id,
        r.name as restaurant_name
      FROM Cart_Items ci
      JOIN Menu_Items mi ON ci.menu_item_id = mi.menu_item_id
      JOIN Restaurants r ON mi.restaurant_id = r.restaurant_id
      WHERE ci.customer_id = $1
    `, [customerId]);
        return items;
    }

    async add(customerId, menuItemId, quantity, notes) {
        await pool.query(`SELECT * FROM sp_add_to_cart($1, $2, $3, $4)', [
            customerId,
            menuItemId,
            quantity,
            notes
        ]);
    }

    async update(cartItemId, quantity) {
        await pool.query('UPDATE Cart_Items SET quantity = $1 WHERE cart_item_id = $2', [quantity, cartItemId]
        );
    }

    async remove(cartItemId) {
        await pool.query('DELETE FROM Cart_Items WHERE cart_item_id = $1', [cartItemId]);
    }

    async clear(customerId) {
        await pool.query('DELETE FROM Cart_Items WHERE customer_id = $1', [customerId]);
    }
}

module.exports = new CartRepository();
