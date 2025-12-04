const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const pool = require('../config/db');

// Get customer favorites
router.get('/', auth, async (req, res, next) => {
  try {
    const [customer] = await pool.query('SELECT customer_id FROM Customers WHERE user_id = ?', [req.user.id]);
    if (!customer[0]) return res.status(404).json({ message: 'Customer not found' });
    
    const [favorites] = await pool.query(`
      SELECT r.*, f.created_at as favorited_at
      FROM Favorite_Restaurants f
      JOIN Restaurants r ON f.restaurant_id = r.restaurant_id
      WHERE f.customer_id = ?
      ORDER BY f.created_at DESC
    `, [customer[0].customer_id]);
    
    res.json(favorites);
  } catch (err) {
    next(err);
  }
});

// Add to favorites
router.post('/:restaurantId', auth, async (req, res, next) => {
  try {
    const [customer] = await pool.query('SELECT customer_id FROM Customers WHERE user_id = ?', [req.user.id]);
    if (!customer[0]) return res.status(404).json({ message: 'Customer not found' });
    
    await pool.query(
      'INSERT INTO Favorite_Restaurants (customer_id, restaurant_id) VALUES (?, ?)',
      [customer[0].customer_id, req.params.restaurantId]
    );
    
    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Remove from favorites
router.delete('/:restaurantId', auth, async (req, res, next) => {
  try {
    const [customer] = await pool.query('SELECT customer_id FROM Customers WHERE user_id = ?', [req.user.id]);
    if (!customer[0]) return res.status(404).json({ message: 'Customer not found' });
    
    await pool.query(
      'DELETE FROM Favorite_Restaurants WHERE customer_id = ? AND restaurant_id = ?',
      [customer[0].customer_id, req.params.restaurantId]
    );
    
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
