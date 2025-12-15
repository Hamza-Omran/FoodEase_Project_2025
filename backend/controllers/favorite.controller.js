const pool = require('../config/db');
const AppError = require('../utils/AppError');

// Add to favorites
exports.addFavorite = async (req, res, next) => {
  try {
    const { restaurant_id } = req.body;

    // Get customer_id
    const { rows: customers } = await pool.query('SELECT customer_id FROM Customers WHERE user_id = $1', [req.user.id]
    );

    if (!customers[0]) {
      return next(new AppError('Customer not found', 404));
    }

    // Check if restaurant exists
    const [[restaurant]] = await pool.query('SELECT restaurant_id FROM Restaurants WHERE restaurant_id = $1', [restaurant_id]
    );

    if (!restaurant) {
      return next(new AppError('Restaurant not found', 404));
    }

    // Add to favorites
    await pool.query('INSERT INTO Favorite_Restaurants (customer_id, restaurant_id) VALUES ($1, $2)', [customers[0].customer_id, restaurant_id]
    );

    res.json({ success: true, message: 'Added to favorites' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return next(new AppError('Already in favorites', 400));
    }
    next(err);
  }
};

// Remove from favorites
exports.removeFavorite = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;

    // Get customer_id
    const { rows: customers } = await pool.query('SELECT customer_id FROM Customers WHERE user_id = $1', [req.user.id]
    );

    if (!customers[0]) {
      return next(new AppError('Customer not found', 404));
    }

    await pool.query('DELETE FROM Favorite_Restaurants WHERE customer_id = $1 AND restaurant_id = $2', [customers[0].customer_id, restaurantId]
    );

    res.json({ success: true, message: 'Removed from favorites' });
  } catch (err) {
    next(err);
  }
};

// Get favorites
exports.getFavorites = async (req, res, next) => {
  try {
    // Get customer_id
    const { rows: customers } = await pool.query('SELECT customer_id FROM Customers WHERE user_id = $1', [req.user.id]
    );

    if (!customers[0]) {
      return next(new AppError('Customer not found', 404));
    }

    const { rows: favorites } = await pool.query(`
      SELECT 
        r.*
      FROM Favorite_Restaurants fr
      JOIN Restaurants r ON fr.restaurant_id = r.restaurant_id
      WHERE fr.customer_id = $1
      ORDER BY fr.favorite_id DESC
    `, [customers[0].customer_id]);

    res.json(favorites);
  } catch (err) {
    next(err);
  }
};

// Check if favorite
exports.isFavorite = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;

    // Get customer_id
    const { rows: customers } = await pool.query('SELECT customer_id FROM Customers WHERE user_id = $1', [req.user.id]
    );

    if (!customers[0]) {
      return res.json({ is_favorite: false });
    }

    const [[result]] = await pool.query('SELECT COUNT(*) as count FROM Favorite_Restaurants WHERE customer_id = $1 AND restaurant_id = $2', [customers[0].customer_id, restaurantId]
    );

    res.json({ is_favorite: result.count > 0 });
  } catch (err) {
    next(err);
  }
};
