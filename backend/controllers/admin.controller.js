const pool = require('../config/db');
const AppError = require('../utils/AppError');
const bcrypt = require('bcrypt');

// ============================================
// SYSTEM OVERVIEW
// ============================================

exports.getSystemOverview = async (req, res, next) => {
  try {
    const { rows: temprestaurantCount } = await pool.query('SELECT COUNT(*) as count FROM Restaurants');
    const { rows: tempcustomerCount } = await pool.query('SELECT COUNT(*) as count FROM Customers');
    const { rows: temporderCount } = await pool.query('SELECT COUNT(*) as count FROM Orders');
    const { rows: tempdriverCount } = await pool.query('SELECT COUNT(*) as count FROM Drivers');

    const { rows: temprevenueStats } = await pool.query(`
      SELECT 
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as avg_order_value,
        COUNT(*) as order_count
      FROM Orders
      WHERE order_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND status = 'delivered'
    `);

    const { rows: dailySales } = await pool.query(`
      SELECT * FROM vw_daily_sales
      WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      ORDER BY order_date DESC
    `);

    const { rows: statusBreakdown } = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM Orders
      WHERE order_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY status
    `);

    res.json({
      counts: {
        restaurants: restaurantCount.count,
        customers: customerCount.count,
        orders: orderCount.count,
        drivers: driverCount.count
      },
      revenue: revenueStats,
      dailySales,
      statusBreakdown
    });
  } catch (err) {
    next(err);
  }
};

// ============================================
// RESTAURANT CRUD
// ============================================

// Get all restaurants
exports.getAllRestaurants = async (req, res, next) => {
  try {
    const { rows: restaurants } = await pool.query(`
      SELECT 
        r.*,
        u.full_name as owner_name,
        u.email as owner_email,
        u.phone as owner_phone
      FROM Restaurants r
      LEFT JOIN Users u ON r.owner_id = u.user_id
      ORDER BY r.restaurant_id DESC
    `);

    res.json(restaurants);
  } catch (err) {
    next(err);
  }
};

// Get single restaurant
exports.getRestaurant = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows: restaurants } = await pool.query(`
      SELECT 
        r.*,
        u.full_name as owner_name,
        u.email as owner_email,
        u.phone as owner_phone
      FROM Restaurants r
      LEFT JOIN Users u ON r.owner_id = u.user_id
      WHERE r.restaurant_id = 
    `, [id]);

    if (!restaurants[0]) {
      return next(new AppError('Restaurant not found', 404));
    }

    res.json(restaurants[0]);
  } catch (err) {
    next(err);
  }
};

// Create restaurant
exports.createRestaurant = async (req, res, next) => {
  try {
    const {
      owner_email,
      owner_password,
      owner_name,
      owner_phone,
      name,
      description,
      phone,
      email,
      street_address,
      city,
      state,
      postal_code,
      opening_time,
      closing_time,
      delivery_fee,
      minimum_order,
      cuisine_type
    } = req.body;

    // Create owner user first
    const hashedPassword = await bcrypt.hash(owner_password, 10);

    const { rows: userResult } = await pool.query(`
      INSERT INTO Users (email, password_hash, role, phone, full_name, is_active)
      VALUES (, ?, 'restaurant_owner', , ?, 1)
    `, [owner_email, hashedPassword, owner_phone, owner_name]);

    const ownerId = userResult.insertId;

    // Create restaurant
    const { rows: restaurantResult } = await pool.query(`
      INSERT INTO Restaurants (
        owner_id, name, description, phone, email,
        street_address, city,
        status, delivery_fee, minimum_order, estimated_delivery_time,
        cuisine_type, is_featured
      ) VALUES (, ?, ?, ?, ?, ?, ?, 'active', , ?, 30, ?, 0)
    `, [
      ownerId, name, description, phone, email,
      street_address, city,
      delivery_fee, minimum_order, cuisine_type
    ]);

    res.status(201).json({
      success: true,
      restaurant_id: restaurantResult.insertId,
      owner_id: ownerId
    });
  } catch (err) {
    next(err);
  }
};

// Update restaurant
exports.updateRestaurant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic UPDATE query
    const fields = [];
    const values = [];

    const allowedFields = [
      'name', 'description', 'phone', 'email',
      'street_address', 'city',
      'status', 'delivery_fee', 'minimum_order', 'estimated_delivery_time',
      'cuisine_type', 'is_featured'
    ];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        fields.push(`${field} = `);
        values.push(updates[field]);
      }
    }

    if (fields.length === 0) {
      return next(new AppError('No fields to update', 400));
    }

    values.push(id);

    await pool.query(
      `UPDATE Restaurants SET ${fields.join(', ')} WHERE restaurant_id = `,
      values
    );

    res.json({ success: true, message: 'Restaurant updated' });
  } catch (err) {
    next(err);
  }
};

// Delete restaurant
exports.deleteRestaurant = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get owner_id first
    const { rows: restaurants } = await pool.query(
      'SELECT owner_id FROM Restaurants WHERE restaurant_id = ',
      [id]
    );

    if (!restaurants[0]) {
      return next(new AppError('Restaurant not found', 404));
    }

    const ownerId = restaurants[0].owner_id;

    // Delete restaurant (cascades to menu items, orders, etc.)
    await pool.query('DELETE FROM Restaurants WHERE restaurant_id = ', [id]);

    // Delete owner user
    await pool.query('DELETE FROM Users WHERE user_id = ', [ownerId]);

    res.json({ success: true, message: 'Restaurant and owner deleted' });
  } catch (err) {
    next(err);
  }
};

// ============================================
// DRIVER CRUD
// ============================================

// Get all drivers
exports.getAllDrivers = async (req, res, next) => {
  try {
    const { rows: drivers } = await pool.query(`
      SELECT 
        d.*,
        u.full_name,
        u.email,
        u.phone,
        u.is_active
      FROM Drivers d
      JOIN Users u ON d.user_id = u.user_id
      ORDER BY d.driver_id DESC
    `);

    res.json(drivers);
  } catch (err) {
    next(err);
  }
};

// Get single driver
exports.getDriver = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows: drivers } = await pool.query(`
      SELECT 
        d.*,
        u.full_name,
        u.email,
        u.phone,
        u.is_active
      FROM Drivers d
      JOIN Users u ON d.user_id = u.user_id
      WHERE d.driver_id = 
    `, [id]);

    if (!drivers[0]) {
      return next(new AppError('Driver not found', 404));
    }

    res.json(drivers[0]);
  } catch (err) {
    next(err);
  }
};

// Create driver
exports.createDriver = async (req, res, next) => {
  try {
    const {
      email,
      password,
      full_name,
      phone,
      vehicle_type,
      vehicle_model,
      license_plate,
      license_number
    } = req.body;



    // Create user first
    const hashedPassword = await bcrypt.hash(password, 10);

    const { rows: userResult } = await pool.query(`
      INSERT INTO Users (email, password_hash, role, phone, full_name, is_active)
      VALUES (, ?, 'driver', , ?, 1)
    `, [email, hashedPassword, phone, full_name]);

    const userId = userResult.insertId;

    // Create driver
    const { rows: driverResult } = await pool.query(`
      INSERT INTO Drivers (
        user_id, vehicle_type, vehicle_model, license_plate,
        license_number, is_available
      ) VALUES (, ?, ?, ?, ?, 1)
    `, [userId, vehicle_type, vehicle_model, license_plate, license_number]);

    res.status(201).json({
      success: true,
      driver_id: driverResult.insertId,
      user_id: userId
    });
  } catch (err) {
    next(err);
  }
};

// Update driver
exports.updateDriver = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const fields = [];
    const values = [];

    const allowedFields = [
      'vehicle_type', 'vehicle_model', 'license_plate',
      'license_number', 'is_available'
    ];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        fields.push(`${field} = `);
        values.push(updates[field]);
      }
    }

    if (fields.length === 0) {
      return next(new AppError('No fields to update', 400));
    }

    values.push(id);

    await pool.query(
      `UPDATE Drivers SET ${fields.join(', ')} WHERE driver_id = `,
      values
    );

    res.json({ success: true, message: 'Driver updated' });
  } catch (err) {
    next(err);
  }
};

// Delete driver
exports.deleteDriver = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get user_id first
    const { rows: drivers } = await pool.query(
      'SELECT user_id FROM Drivers WHERE driver_id = ',
      [id]
    );

    if (!drivers[0]) {
      return next(new AppError('Driver not found', 404));
    }

    const userId = drivers[0].user_id;

    // Delete driver
    await pool.query('DELETE FROM Drivers WHERE driver_id = ', [id]);

    // Delete user
    await pool.query('DELETE FROM Users WHERE user_id = ', [userId]);

    res.json({ success: true, message: 'Driver and user deleted' });
  } catch (err) {
    next(err);
  }
};
