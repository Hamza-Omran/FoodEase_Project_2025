const pool = require('../config/db');

// Search restaurants
exports.searchRestaurants = async (req, res, next) => {
  try {
    const { 
      query, 
      city, 
      cuisine_type, 
      min_rating,
      is_featured,
      sort_by = 'rating',
      order = 'DESC',
      limit = 20,
      offset = 0
    } = req.query;

    let sql = 'SELECT * FROM Restaurants WHERE status = "active"';
    const params = [];

    if (query) {
      sql += ' AND (name LIKE ? OR description LIKE ? OR cuisine_type LIKE ?)';
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (city) {
      sql += ' AND city = ?';
      params.push(city);
    }

    if (cuisine_type) {
      sql += ' AND cuisine_type = ?';
      params.push(cuisine_type);
    }

    if (min_rating) {
      sql += ' AND rating >= ?';
      params.push(parseFloat(min_rating));
    }

    if (is_featured) {
      sql += ' AND is_featured = TRUE';
    }

    // Sort
    const allowedSorts = ['rating', 'created_at', 'name', 'delivery_fee'];
    if (allowedSorts.includes(sort_by)) {
      sql += ` ORDER BY ${sort_by} ${order === 'ASC' ? 'ASC' : 'DESC'}`;
    }

    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [restaurants] = await pool.query(sql, params);

    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM Restaurants WHERE status = "active"';
    const countParams = [];

    if (query) {
      countSql += ' AND (name LIKE ? OR description LIKE ? OR cuisine_type LIKE ?)';
      const searchTerm = `%${query}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (city) {
      countSql += ' AND city = ?';
      countParams.push(city);
    }

    if (cuisine_type) {
      countSql += ' AND cuisine_type = ?';
      countParams.push(cuisine_type);
    }

    if (min_rating) {
      countSql += ' AND rating >= ?';
      countParams.push(parseFloat(min_rating));
    }

    const [[{ total }]] = await pool.query(countSql, countParams);

    res.json({
      restaurants,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

// Search menu items
exports.searchMenuItems = async (req, res, next) => {
  try {
    const {
      query,
      restaurant_id,
      category_id,
      is_vegetarian,
      is_vegan,
      is_spicy,
      min_price,
      max_price,
      limit = 50,
      offset = 0
    } = req.query;

    let sql = `
      SELECT 
        mi.*,
        r.name as restaurant_name,
        mc.name as category_name
      FROM Menu_Items mi
      JOIN Restaurants r ON mi.restaurant_id = r.restaurant_id
      LEFT JOIN Menu_Categories mc ON mi.category_id = mc.category_id
      WHERE mi.is_available = TRUE
    `;
    const params = [];

    if (query) {
      sql += ' AND (mi.name LIKE ? OR mi.description LIKE ?)';
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm);
    }

    if (restaurant_id) {
      sql += ' AND mi.restaurant_id = ?';
      params.push(restaurant_id);
    }

    if (category_id) {
      sql += ' AND mi.category_id = ?';
      params.push(category_id);
    }

    if (is_vegetarian) {
      sql += ' AND mi.is_vegetarian = TRUE';
    }

    if (is_vegan) {
      sql += ' AND mi.is_vegan = TRUE';
    }

    if (is_spicy) {
      sql += ' AND mi.is_spicy = TRUE';
    }

    if (min_price) {
      sql += ' AND mi.price >= ?';
      params.push(parseFloat(min_price));
    }

    if (max_price) {
      sql += ' AND mi.price <= ?';
      params.push(parseFloat(max_price));
    }

    sql += ' ORDER BY mi.total_orders DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [items] = await pool.query(sql, params);

    res.json(items);
  } catch (err) {
    next(err);
  }
};

// Get filter options
exports.getFilterOptions = async (req, res, next) => {
  try {
    // Get unique cities
    const [cities] = await pool.query(`
      SELECT DISTINCT city 
      FROM Restaurants 
      WHERE status = 'active' AND city IS NOT NULL
      ORDER BY city
    `);

    // Get unique cuisine types
    const [cuisines] = await pool.query(`
      SELECT DISTINCT cuisine_type 
      FROM Restaurants 
      WHERE status = 'active' AND cuisine_type IS NOT NULL
      ORDER BY cuisine_type
    `);

    // Get price range
    const [[priceRange]] = await pool.query(`
      SELECT 
        MIN(price) as min_price,
        MAX(price) as max_price
      FROM Menu_Items
      WHERE is_available = TRUE
    `);

    res.json({
      cities: cities.map(c => c.city),
      cuisines: cuisines.map(c => c.cuisine_type),
      price_range: priceRange
    });
  } catch (err) {
    next(err);
  }
};
