const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');
const pool = require('../config/db');
const AppError = require('../utils/AppError');

// GET /api/v1/orders - current customer's orders
router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    console.log('GET /orders for user:', req.user);

    if (req.user.role !== 'customer') {
      throw new AppError('Only customers can view their orders', 403);
    }

    const [[customerRow]] = await pool.query(
      'SELECT customer_id FROM Customers WHERE user_id = ?',
      [req.user.id]
    );
    if (!customerRow) {
      console.error('No Customers row for user_id', req.user.id);
      throw new AppError('Customer profile not found', 400);
    }

    const [rows] = await pool.query(
      `SELECT 
         o.*,
         r.name AS restaurant_name,
         ca.street_address AS delivery_address
       FROM Orders o
       JOIN Restaurants r ON o.restaurant_id = r.restaurant_id
       JOIN Customer_Addresses ca ON o.delivery_address_id = ca.address_id
       WHERE o.customer_id = ?
       ORDER BY o.order_date DESC`,
      [customerRow.customer_id]
    );

    console.log(`✅ Found ${rows.length} orders`);
    res.json(rows);
  })
);

// POST /api/v1/orders - place order (using sp_place_order)
router.post(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    console.log('POST /orders payload:', req.body, 'user:', req.user);

    if (req.user.role !== 'customer') {
      throw new AppError('Only customers can place orders', 403);
    }

    const {
      restaurant_id,
      address_id,
      payment_method = 'cash',
      special_instructions = null,
      coupon_code = null,
    } = req.body;

    if (!restaurant_id || !address_id) {
      throw new AppError('restaurant_id and address_id are required', 400);
    }

    const [[customerRow]] = await pool.query(
      'SELECT customer_id FROM Customers WHERE user_id = ?',
      [req.user.id]
    );
    if (!customerRow) {
      throw new AppError('Customer profile not found', 400);
    }
    const customerId = customerRow.customer_id;

    // debug cart before placing order
    const [beforeRows] = await pool.query(
      'SELECT * FROM Cart_Items WHERE customer_id = ? AND restaurant_id = ?',
      [customerId, restaurant_id]
    );
    console.log('Cart rows BEFORE order:', beforeRows);

    try {
      await pool.query('CALL sp_place_order(?, ?, ?, ?, ?, ?)', [
        customerId,
        restaurant_id,
        address_id,
        special_instructions,
        payment_method,
        coupon_code,
      ]);

      const [[order]] = await pool.query(
        `SELECT * FROM Orders 
         WHERE customer_id = ? AND restaurant_id = ?
         ORDER BY order_id DESC
         LIMIT 1`,
        [customerId, restaurant_id]
      );

      if (!order) {
        throw new AppError('Order created but could not be loaded', 500);
      }

      const [afterRows] = await pool.query(
        'SELECT * FROM Cart_Items WHERE customer_id = ? AND restaurant_id = ?',
        [customerId, restaurant_id]
      );
      console.log('Cart rows AFTER order:', afterRows);

      res.status(201).json(order);
    } catch (err) {
      console.error('Error in POST /orders:', err);
      if (err.sqlState === '45000') {
        // custom SIGNAL from procedure
        throw new AppError(err.message, 400);
      }
      throw err;
    }
  })
);

// PUT /api/v1/orders/status/:id - update status
router.put(
  '/status/:id',
  auth,
  asyncHandler(async (req, res) => {
    const orderId = parseInt(req.params.id, 10);
    const { status, cancellation_reason } = req.body;

    console.log('PUT /orders/status', { orderId, status, by: req.user.id });

    try {
      await pool.query('CALL sp_update_order_status(?, ?, ?, ?)', [
        orderId,
        status,
        req.user.id,
        cancellation_reason || null,
      ]);
      res.json({ success: true });
    } catch (err) {
      console.error('Error in PUT /orders/status:', err);
      if (err.sqlState === '45000') {
        throw new AppError(err.message, 400);
      }
      throw err;
    }
  })
);

// GET /api/v1/orders/:id - tracking (OrderTrackingPage)
router.get(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const orderId = parseInt(req.params.id, 10);
    console.log('🔍 GET /orders/:id tracking', {
      orderId,
      user: req.user,
    });

    if (Number.isNaN(orderId)) {
      console.warn('⚠️ Invalid order id param:', req.params.id);
      throw new AppError('Invalid order id', 400);
    }

    try {
      if (req.user.role === 'customer') {
        const [[ownCheck]] = await pool.query(
          `SELECT o.order_id
           FROM Orders o
           JOIN Customers c ON o.customer_id = c.customer_id
           WHERE o.order_id = ? AND c.user_id = ?`,
          [orderId, req.user.id]
        );
        console.log('Ownership check result:', ownCheck);
        if (!ownCheck) {
          console.warn('🚫 Customer tried to access another order', {
            orderId,
            userId: req.user.id,
          });
          return res.status(404).json({ message: 'Order not found' });
        }
      }

      console.log('Calling sp_get_order_tracking with orderId=', orderId);
      const [callResult] = await pool.query('CALL sp_get_order_tracking(?)', [
        orderId,
      ]);

      const tracking = callResult[0]?.[0];
      console.log('sp_get_order_tracking raw result:', JSON.stringify(callResult));
      console.log('Parsed tracking row:', tracking);

      if (!tracking) {
        console.warn('No tracking row returned for order_id', orderId);
        return res.status(404).json({ message: 'Order not found' });
      }

      const [items] = await pool.query(
        'SELECT * FROM Order_Items WHERE order_id = ?',
        [orderId]
      );
      console.log('Order items loaded:', items.length);

      return res.json({ ...tracking, items });
    } catch (err) {
      console.error('❌ Error in GET /orders/:id tracking');
      console.error('  SQL state:', err.sqlState);
      console.error('  SQL code:', err.code);
      console.error('  Message:', err.message);

      if (err.sqlState === '45000') {
        return res
          .status(400)
          .json({ message: err.message || 'Failed to load order tracking' });
      }

      return res
        .status(500)
        .json({ message: 'Failed to load order tracking. Please try again.' });
    }
  })
);

module.exports = router;
