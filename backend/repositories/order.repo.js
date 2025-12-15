const pool = require('../config/db');

class OrderRepository {
    async placeOrder(customerId, restaurantId, addressId, specialInstructions, paymentMethod, couponCode) {
        // 1. Call stored procedure to place order
        await pool.query(
            'SELECT * FROM sp_place_order($1, $2, $3, $4, $5, $6)',
            [customerId, restaurantId, addressId, specialInstructions, paymentMethod, couponCode]
        );

        // 2. Get the created order (latest for customer)
        const { rows: orders } = await pool.query(
            `SELECT 
        o.*,
        r.name as restaurant_name,
        ca.street_address,
        ca.city,
        ca.street_address || ', ' || ca.city as delivery_address
       FROM Orders o
       JOIN Restaurants r ON o.restaurant_id = r.restaurant_id
       JOIN Customer_Addresses ca ON o.delivery_address_id = ca.address_id
       WHERE o.customer_id = $1
       ORDER BY o.order_date DESC 
       LIMIT 1`,
            [customerId]
        );

        if (!orders.length) {
            throw new Error('Order creation failed');
        }

        const order = orders[0];

        // 3. Get order items
        const { rows: items } = await pool.query(
            `SELECT 
        oi.*,
        mi.name,
        mi.image_url
       FROM Order_Items oi
       JOIN Menu_Items mi ON oi.menu_item_id = mi.menu_item_id
       WHERE oi.order_id = $1`,
            [order.order_id]
        );

        order.items = items;
        return order;
    }

    async listByUser(customerId) {
        const { rows: orders } = await pool.query(
            `SELECT 
        o.*,
        r.name as restaurant_name,
        r.image_url as restaurant_image
      FROM Orders o
      JOIN Restaurants r ON o.restaurant_id = r.restaurant_id
      WHERE o.customer_id = $1
      ORDER BY o.order_date DESC`,
            [customerId]
        );
        return orders;
    }

    async getForTracking(idOrNumber) {
        // Try to find by ID first, then number
        let query = 'SELECT order_id FROM Orders WHERE order_id = $1';
        let params = [idOrNumber];

        // If it looks like a UUID or long string, assume it might be order_number (though order_number is usually UUID)
        // But here idOrNumber is likely the ID from the route /orders/:id/track
        // If the route param is orderId, it's the int ID.

        // Using sp_get_order_tracking requires ID.
        // Let's first get the ID if it's a number string, or resolve it.

        // Actually, let's just query the view/tables directly to be flexible
        const { rows: orders } = await pool.query(
            `SELECT 
        o.*,
        r.name AS restaurant_name,
        r.phone AS restaurant_phone,
        ca.street_address,
        ca.city,
        ca.address_label,
        ca.street_address || ', ' || ca.city as delivery_address,
        da.delivery_status,
        u.full_name as driver_name,
        u.phone as driver_phone
      FROM Orders o
      JOIN Restaurants r ON o.restaurant_id = r.restaurant_id
      JOIN Customer_Addresses ca ON o.delivery_address_id = ca.address_id
      LEFT JOIN Delivery_Assignments da ON o.order_id = da.order_id
      LEFT JOIN Drivers d ON da.driver_id = d.driver_id
      LEFT JOIN Users u ON d.user_id = u.user_id
      WHERE o.order_id = $1 OR o.order_number = $2
    `, [idOrNumber, idOrNumber]);

        if (!orders.length) return null;
        const order = orders[0];

        // Get items
        const { rows: items } = await pool.query(
            `SELECT 
        oi.*,
        mi.name,
        mi.image_url
       FROM Order_Items oi
       JOIN Menu_Items mi ON oi.menu_item_id = mi.menu_item_id
       WHERE oi.order_id = $1`,
            [order.order_id]
        );

        order.items = items;
        return order;
    }

    async updateStatus(orderId, status, userId, cancellationReason) {
        await pool.query(
            'SELECT * FROM sp_update_order_status($1, $2, $3, $4)',
            [orderId, status, userId, cancellationReason]
        );

        // Return updated order
        const { rows: orders } = await pool.query('SELECT * FROM Orders WHERE order_id = $1', [orderId]);
        return orders[0];
    }

    async remove(orderId) {
        await pool.query('DELETE FROM Orders WHERE order_id = ?', [orderId]);
    }
}

module.exports = new OrderRepository();
