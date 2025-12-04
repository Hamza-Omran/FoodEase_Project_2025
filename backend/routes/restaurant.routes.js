const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');
const restaurantController = require('../controllers/restaurant.controller');
const pool = require('../config/db');

// Public routes
router.get('/', asyncHandler(restaurantController.list));

// ✅ GET /restaurants/my - MUST be before /:id
router.get('/my', auth, asyncHandler(async (req, res) => {
  console.log('🔍 GET /restaurants/my for user:', req.user);
  
  if (req.user.role !== 'restaurant_owner') {
    return res.status(403).json({ message: 'Only restaurant owners can access this' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM Restaurants WHERE owner_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    console.log(`✅ Found ${rows.length} restaurants for owner ${req.user.id}`);
    res.json(rows);
  } catch (err) {
    console.error('❌ Error in GET /restaurants/my:', err);
    res.status(500).json({ message: 'Failed to fetch restaurants', error: err.message });
  }
}));

// Protected routes
router.get('/:id', asyncHandler(restaurantController.get));
router.get('/:id/menu', asyncHandler(restaurantController.getMenu));
router.post('/', auth, asyncHandler(restaurantController.create));
router.put('/:id', auth, asyncHandler(restaurantController.update));
router.delete('/:id', auth, asyncHandler(restaurantController.remove));

// Categories
router.get('/:id/categories', asyncHandler(restaurantController.getCategories));
router.post('/:id/categories', auth, asyncHandler(restaurantController.createCategory));
router.put('/categories/:id', auth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  const [[cat]] = await pool.query(
    `SELECT mc.category_id, r.owner_id
     FROM Menu_Categories mc
     JOIN Restaurants r ON mc.restaurant_id = r.restaurant_id
     WHERE mc.category_id = ?`,
    [id]
  );

  if (!cat || cat.owner_id !== req.user.id) {
    return next(new AppError('Forbidden', 403));
  }

  await pool.query(
    'UPDATE Menu_Categories SET name = ?, description = ? WHERE category_id = ?',
    [name, description, id]
  );

  res.json({ success: true, category_id: id });
}));
router.delete('/categories/:id', auth, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [[cat]] = await pool.query(
    `SELECT mc.category_id, r.owner_id
     FROM Menu_Categories mc
     JOIN Restaurants r ON mc.restaurant_id = r.restaurant_id
     WHERE mc.category_id = ?`,
    [id]
  );

  if (!cat || cat.owner_id !== req.user.id) {
    return next(new AppError('Forbidden', 403));
  }

  await pool.query('DELETE FROM Menu_Categories WHERE category_id = ?', [id]);
  res.json({ success: true });
}));

// Orders for restaurant
router.get('/:id/orders', auth, asyncHandler(restaurantController.getOrders));

module.exports = router;