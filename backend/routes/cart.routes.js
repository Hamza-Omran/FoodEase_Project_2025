const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');
const pool = require('../config/db');
const AppError = require('../utils/AppError');

// helper: find customer_id from logged-in user
async function getCustomerId(userId) {
  const [[row]] = await pool.query(
    'SELECT customer_id FROM Customers WHERE user_id = ?',
    [userId]
  );
  return row?.customer_id || null;
}

// GET /api/v1/cart
router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    if (req.user.role !== 'customer') {
      throw new AppError('Only customers have carts', 403);
    }
    const customerId = await getCustomerId(req.user.id);
    if (!customerId) throw new AppError('Customer profile not found', 400);

    const [rows] = await pool.query(
      `SELECT 
         ci.*,
         mi.name,
         mi.image_url,
         mi.price,
         r.name AS restaurant_name
       FROM Cart_Items ci
       JOIN Menu_Items mi ON ci.menu_item_id = mi.menu_item_id
       JOIN Restaurants r ON ci.restaurant_id = r.restaurant_id
       WHERE ci.customer_id = ?`,
      [customerId]
    );

    res.json(rows);
  })
);

// POST /api/v1/cart/add
router.post(
  '/add',
  auth,
  asyncHandler(async (req, res) => {
    if (req.user.role !== 'customer') {
      throw new AppError('Only customers have carts', 403);
    }
    const { menu_item_id, quantity, notes } = req.body;
    const customerId = await getCustomerId(req.user.id);
    if (!customerId) throw new AppError('Customer profile not found', 400);

    try {
      await pool.query('CALL sp_add_to_cart(?, ?, ?, ?)', [
        customerId,
        menu_item_id,
        quantity || 1,
        notes || null,
      ]);
      res.status(201).json({ success: true });
    } catch (err) {
      if (err.sqlState === '45000') {
        throw new AppError(err.message, 400);
      }
      throw err;
    }
  })
);

// PUT /api/v1/cart/:id - update quantity
router.put(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    if (req.user.role !== 'customer') {
      throw new AppError('Only customers have carts', 403);
    }
    const cartItemId = parseInt(req.params.id, 10);
    const { quantity } = req.body;

    const customerId = await getCustomerId(req.user.id);
    if (!customerId) throw new AppError('Customer profile not found', 400);

    if (quantity <= 0) {
      await pool.query(
        'DELETE FROM Cart_Items WHERE cart_item_id = ? AND customer_id = ?',
        [cartItemId, customerId]
      );
      return res.json({ success: true });
    }

    const [result] = await pool.query(
      `UPDATE Cart_Items 
       SET quantity = ? 
       WHERE cart_item_id = ? AND customer_id = ?`,
      [quantity, cartItemId, customerId]
    );

    if (result.affectedRows === 0) {
      throw new AppError('Cart item not found', 404);
    }

    res.json({ success: true });
  })
);

// DELETE /api/v1/cart/:id
router.delete(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    if (req.user.role !== 'customer') {
      throw new AppError('Only customers have carts', 403);
    }
    const cartItemId = parseInt(req.params.id, 10);
    const customerId = await getCustomerId(req.user.id);
    if (!customerId) throw new AppError('Customer profile not found', 400);

    const [result] = await pool.query(
      'DELETE FROM Cart_Items WHERE cart_item_id = ? AND customer_id = ?',
      [cartItemId, customerId]
    );

    if (result.affectedRows === 0) {
      throw new AppError('Cart item not found', 404);
    }

    res.json({ success: true });
  })
);

module.exports = router;
