const restaurantRepo = require('../repositories/restaurant.repo');
const pool = require('../config/db');
const AppError = require('../utils/AppError');

exports.list = async (req, res, next) => {
  try {
    const restaurants = await restaurantRepo.list();
    res.json(restaurants);
  } catch (err) {
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    const { id } = req.params;
    const restaurant = await restaurantRepo.get(id);
    if (!restaurant) {
      return next(new AppError('Restaurant not found', 404));
    }
    res.json(restaurant);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    if (req.user.role !== 'restaurant_owner' && req.user.role !== 'admin') {
      return next(new AppError('Only restaurant owners can create restaurants', 403));
    }

    // Check if owner already has a restaurant
    const [[existing]] = await pool.query(
      'SELECT restaurant_id FROM Restaurants WHERE owner_id = ?',
      [req.user.id]
    );

    if (existing) {
      return next(new AppError('You already have a restaurant. Each owner can only have one restaurant.', 400));
    }

    const restaurant = await restaurantRepo.create({
      ...req.body,
      owner_id: req.user.id,
    });

    res.status(201).json(restaurant);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const [[restaurant]] = await pool.query(
      'SELECT owner_id FROM Restaurants WHERE restaurant_id = ?',
      [id]
    );
    
    if (!restaurant) {
      return next(new AppError('Restaurant not found', 404));
    }
    
    if (req.user.role === 'restaurant_owner' && restaurant.owner_id !== req.user.id) {
      return next(new AppError('Forbidden', 403));
    }

    const updated = await restaurantRepo.update(id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const [[restaurant]] = await pool.query(
      'SELECT owner_id FROM Restaurants WHERE restaurant_id = ?',
      [id]
    );
    
    if (!restaurant) {
      return next(new AppError('Restaurant not found', 404));
    }
    
    if (req.user.role === 'restaurant_owner' && restaurant.owner_id !== req.user.id) {
      return next(new AppError('Forbidden', 403));
    }

    await restaurantRepo.remove(id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

exports.getMenu = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [items] = await pool.query(
      `SELECT mi.*, mc.name as category_name
       FROM Menu_Items mi
       LEFT JOIN Menu_Categories mc ON mi.category_id = mc.category_id
       WHERE mi.restaurant_id = ?
       ORDER BY mc.display_order, mi.name`,
      [id]
    );
    res.json(items);
  } catch (err) {
    next(err);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [cats] = await pool.query(
      'SELECT * FROM Menu_Categories WHERE restaurant_id = ? ORDER BY display_order',
      [id]
    );
    res.json(cats);
  } catch (err) {
    next(err);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const [[rest]] = await pool.query('SELECT owner_id FROM Restaurants WHERE restaurant_id = ?', [id]);
    if (!rest || rest.owner_id !== req.user.id) {
      return next(new AppError('Forbidden', 403));
    }

    const [result] = await pool.query(
      'INSERT INTO Menu_Categories (restaurant_id, name, description) VALUES (?, ?, ?)',
      [id, name, description]
    );
    res.status(201).json({ category_id: result.insertId, name });
  } catch (err) {
    next(err);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [[rest]] = await pool.query('SELECT owner_id FROM Restaurants WHERE restaurant_id = ?', [id]);
    if (!rest) {
      return next(new AppError('Restaurant not found', 404));
    }
    if (req.user.role === 'restaurant_owner' && rest.owner_id !== req.user.id) {
      return next(new AppError('Forbidden', 403));
    }

    const [orders] = await pool.query(
      `SELECT 
         o.*,
         u.full_name as customer_name,
         ca.street_address as delivery_address
       FROM Orders o
       JOIN Customers c ON o.customer_id = c.customer_id
       JOIN Users u ON c.user_id = u.user_id
       JOIN Customer_Addresses ca ON o.delivery_address_id = ca.address_id
       WHERE o.restaurant_id = ?
       ORDER BY o.order_date DESC`,
      [id]
    );

    res.json(orders);
  } catch (err) {
    next(err);
  }
};
