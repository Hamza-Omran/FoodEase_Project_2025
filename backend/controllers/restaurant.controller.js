const pool = require('../config/db');
const restaurantRepo = require('../repositories/restaurant.repo');
const AppError = require('../utils/AppError');

// Get all restaurants (full data)
exports.getAll = async (req, res, next) => {
  try {
    const restaurants = await restaurantRepo.list();
    res.json(restaurants);
  } catch (err) {
    next(err);
  }
};

// Optimized: Get restaurants for home page (minimal fields)
exports.getForHome = async (req, res, next) => {
  try {
    const [restaurants] = await pool.query(
      `SELECT restaurant_id, name, image_url, rating, cuisine_type, estimated_delivery_time, delivery_fee, is_featured
       FROM Restaurants 
       WHERE status = 'active' 
       ORDER BY is_featured DESC, rating DESC 
       LIMIT 12`
    );
    res.json(restaurants);
  } catch (err) {
    next(err);
  }
};

// Optimized: Get restaurants for search (filtered fields)
exports.getForSearch = async (req, res, next) => {
  try {
    const { cuisine, city } = req.query;

    let query = `SELECT restaurant_id, name, image_url, cuisine_type, 
                 estimated_delivery_time, delivery_fee, city, description
                 FROM Restaurants WHERE status = 'active'`;
    const params = [];

    if (cuisine) {
      query += ' AND cuisine_type = ?';
      params.push(cuisine);
    }
    if (city) {
      query += ' AND city = ?';
      params.push(city);
    }

    query += ' ORDER BY name ASC';

    const [restaurants] = await pool.query(query, params);
    res.json(restaurants);
  } catch (err) {
    next(err);
  }
};

// Get restaurant by ID
exports.getById = async (req, res, next) => {
  try {
    const restaurant = await restaurantRepo.get(req.params.id);
    if (!restaurant) {
      return next(new AppError('Restaurant not found', 404));
    }
    res.json(restaurant);
  } catch (err) {
    next(err);
  }
};

// Get restaurants owned by logged-in user
exports.getMy = async (req, res, next) => {
  try {

    const [restaurants] = await pool.query(
      'SELECT * FROM Restaurants WHERE owner_id = ?',
      [req.user.id]
    );

    res.json(restaurants);
  } catch (err) {
    next(err);
  }
};

// Create restaurant
exports.create = async (req, res, next) => {
  try {
    const { name, street_address, city, description, cuisine_type, phone } = req.body;

    const restaurant = await restaurantRepo.create({
      owner_id: req.user.id,
      name,
      street_address,
      city,
      description,
      cuisine_type,
      phone
    });

    res.status(201).json(restaurant);
  } catch (err) {
    next(err);
  }
};

// Update restaurant
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify ownership or admin
    const [restaurants] = await pool.query(
      'SELECT owner_id FROM Restaurants WHERE restaurant_id = ?',
      [id]
    );

    if (!restaurants[0]) {
      return next(new AppError('Restaurant not found', 404));
    }

    if (req.user.role !== 'admin' && restaurants[0].owner_id !== req.user.id) {
      return next(new AppError('Not authorized', 403));
    }

    const restaurant = await restaurantRepo.update(id, req.body);
    res.json(restaurant);
  } catch (err) {
    next(err);
  }
};

// Delete restaurant
exports.delete = async (req, res, next) => {
  try {
    await restaurantRepo.remove(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// Get restaurant orders (for owner dashboard)
exports.getRestaurantOrders = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify restaurant ownership (unless admin)
    if (req.user.role === 'restaurant_owner') {
      const [restaurants] = await pool.query(
        'SELECT owner_id FROM Restaurants WHERE restaurant_id = ?',
        [id]
      );

      if (!restaurants[0]) {
        return next(new AppError('Restaurant not found', 404));
      }

      if (restaurants[0].owner_id !== req.user.id) {
        return next(new AppError('Not authorized to view these orders', 403));
      }
    }

    const [orders] = await pool.query(`
      SELECT 
        o.*,
        u.full_name as customer_name,
        u.phone as customer_phone,
        ca.street_address as delivery_address,
        ca.city as delivery_city,
        IF(rr.review_id IS NOT NULL, TRUE, FALSE) as has_review
      FROM Orders o
      JOIN Customers c ON o.customer_id = c.customer_id
      JOIN Users u ON c.user_id = u.user_id
      JOIN Customer_Addresses ca ON o.delivery_address_id = ca.address_id
      LEFT JOIN Restaurant_Reviews rr ON o.order_id = rr.order_id
      WHERE o.restaurant_id = ?
      ORDER BY o.order_date DESC
    `, [id]);

    res.json(orders);
  } catch (err) {
    next(err);
  }
};
