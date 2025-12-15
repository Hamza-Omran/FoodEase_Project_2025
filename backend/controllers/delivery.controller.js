const pool = require('../config/db');
const AppError = require('../utils/AppError');

// Get available orders for drivers (orders that are ready but not assigned)
exports.getAvailableOrders = async (req, res, next) => {
  try {
    const { rows: orders } = await pool.query(`
      SELECT 
        o.order_id,
        o.order_number,
        o.order_date,
        o.delivery_fee,
        o.special_instructions,
        r.name as restaurant_name,
        r.street_address as restaurant_address,
        r.city as restaurant_city,
        r.phone as restaurant_phone,
        ca.street_address as delivery_address,
        ca.city as delivery_city,
        ca.apartment_number,
        ca.delivery_instructions,
        u.full_name as customer_name,
        u.phone as customer_phone
      FROM Orders o
      JOIN Restaurants r ON o.restaurant_id = r.restaurant_id
      JOIN Customer_Addresses ca ON o.delivery_address_id = ca.address_id
      JOIN Customers c ON o.customer_id = c.customer_id
      JOIN Users u ON c.user_id = u.user_id
      LEFT JOIN Delivery_Assignments da ON o.order_id = da.order_id
      WHERE o.status = 'ready'
        AND da.assignment_id IS NULL
      ORDER BY o.order_date DESC
      LIMIT 50
    `);

    res.json(orders);
  } catch (err) {
    next(err);
  }
};

// Get driver's current assignments
exports.getDriverAssignments = async (req, res, next) => {
  try {
    // Get driver_id from user_id
    const { rows: drivers } = await pool.query(
      'SELECT driver_id FROM Drivers WHERE user_id = $1',
      [req.user.id]
    );

    if (!drivers[0]) {
      return next(new AppError('Driver profile not found', 404));
    }

    const driverId = drivers[0].driver_id;

    const { rows: assignments } = await pool.query(`
      SELECT 
        da.assignment_id,
        da.delivery_status,
        da.driver_earnings,
        da.assigned_at,
        o.order_number,
        o.order_id,
        o.total_amount,
        r.name as restaurant_name,
        r.street_address as restaurant_address,
        r.phone as restaurant_phone,
        ca.street_address as delivery_address,
        ca.city as delivery_city,
        ca.apartment_number,
        u.full_name as customer_name,
        u.phone as customer_phone
      FROM Delivery_Assignments da
      JOIN Orders o ON da.order_id = o.order_id
      JOIN Restaurants r ON o.restaurant_id = r.restaurant_id
      JOIN Customer_Addresses ca ON o.delivery_address_id = ca.address_id
      JOIN Customers c ON o.customer_id = c.customer_id
      JOIN Users u ON c.user_id = u.user_id
      WHERE da.driver_id = $1
      ORDER BY 
        CASE da.delivery_status
          WHEN 'in_transit' THEN 1
          WHEN 'picked_up' THEN 2
          WHEN 'accepted' THEN 3
          ELSE 5
        END,
        da.assigned_at DESC
    `, [driverId]);

    res.json(assignments);
  } catch (err) {
    next(err);
  }
};

// Accept delivery assignment (driver accepts an available order)
exports.acceptOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    // Get driver_id
    const { rows: drivers } = await pool.query(
      'SELECT driver_id, is_available FROM Drivers WHERE user_id = $1',
      [req.user.id]
    );

    if (!drivers[0]) {
      return next(new AppError('Driver profile not found', 404));
    }

    const driverId = drivers[0].driver_id;

    // Check if order is available
    const { rows: orders } = await pool.query(
      'SELECT * FROM Orders WHERE order_id = $1 AND status IN (\'ready\', \'confirmed\', \'preparing\')',
      [orderId]
    );

    if (!orders[0]) {
      return next(new AppError('Order not available for delivery', 404));
    }

    // Check if already assigned
    const { rows: existing } = await pool.query(
      'SELECT assignment_id FROM Delivery_Assignments WHERE order_id = $1',
      [orderId]
    );

    if (existing && existing.length > 0) {
      return next(new AppError('Order already assigned to another driver', 400));
    }

    const deliveryFee = parseFloat(orders[0].delivery_fee);
    const driverEarnings = deliveryFee * 0.7; // 70% to driver

    // Create assignment
    const { rows: result } = await pool.query(`
      INSERT INTO Delivery_Assignments (
        order_id, driver_id, delivery_status, delivery_fee, driver_earnings
      ) VALUES ($1, $2, 'accepted', $3, $4) RETURNING assignment_id
    `, [orderId, driverId, deliveryFee, driverEarnings]);

    // Update driver availability
    await pool.query(
      'UPDATE Drivers SET is_available = FALSE WHERE driver_id = $1',
      [driverId]
    );

    // Update order status
    await pool.query(
      'UPDATE Orders SET status = \'out_for_delivery\' WHERE order_id = $1',
      [orderId]
    );

    res.json({
      success: true,
      assignment_id: result[0].assignment_id,
      message: 'Order accepted successfully'
    });
  } catch (err) {
    next(err);
  }
};

// Update delivery status
exports.updateDeliveryStatus = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const { delivery_status, latitude, longitude, notes } = req.body;

    // Validate status
    const validStatuses = ['accepted', 'picked_up', 'in_transit', 'delivered', 'failed'];
    if (!validStatuses.includes(delivery_status)) {
      return next(new AppError('Invalid delivery status', 400));
    }

    // Get driver_id
    const { rows: drivers } = await pool.query(
      'SELECT driver_id FROM Drivers WHERE user_id = $1',
      [req.user.id]
    );

    if (!drivers[0]) {
      return next(new AppError('Driver profile not found', 404));
    }

    // Verify assignment belongs to driver
    const { rows: assignments } = await pool.query(
      'SELECT * FROM Delivery_Assignments WHERE assignment_id = $1 AND driver_id = $2',
      [assignmentId, drivers[0].driver_id]
    );

    if (!assignments[0]) {
      return next(new AppError('Assignment not found', 404));
    }

    const assignment = assignments[0];

    // Update assignment with dynamic fields
    const updates = { delivery_status };
    if (latitude) updates.latitude = latitude;
    if (longitude) updates.longitude = longitude;
    if (notes) updates.notes = notes;

    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const key in updates) {
      if (updates[key] !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    }

    values.push(assignmentId);

    await pool.query(
      `UPDATE Delivery_Assignments SET ${fields.join(', ')} WHERE assignment_id = $${paramIndex}`,
      values
    );

    // Update order status and payment status
    if (delivery_status === 'delivered') {
      await pool.query(
        'UPDATE Orders SET status = \'delivered\', payment_status = \'completed\' WHERE order_id = $1',
        [assignment.order_id]
      );

      // Make driver available again
      await pool.query(
        'UPDATE Drivers SET is_available = TRUE WHERE driver_id = $1',
        [drivers[0].driver_id]
      );
    }

    res.json({ success: true, delivery_status });
  } catch (err) {
    next(err);
  }
};

// Get driver statistics
exports.getDriverStats = async (req, res, next) => {
  try {
    const { rows: drivers } = await pool.query(
      'SELECT * FROM Drivers WHERE user_id = $1',
      [req.user.id]
    );

    if (!drivers[0]) {
      return next(new AppError('Driver profile not found', 404));
    }

    const driver = drivers[0];

    // Get today's earnings
    const { rows: todayStatsResult } = await pool.query(`
      SELECT 
        COUNT(*) as deliveries_today,
        SUM(driver_earnings) as earnings_today
      FROM Delivery_Assignments
      WHERE driver_id = $1
        AND delivery_status = 'delivered'
        AND DATE(assigned_at) = CURRENT_DATE
    `, [driver.driver_id]);

    const todayStats = todayStatsResult[0] || {};

    // Get this week's earnings
    const { rows: weekStatsResult } = await pool.query(`
      SELECT 
        COUNT(*) as deliveries_week,
        SUM(driver_earnings) as earnings_week
      FROM Delivery_Assignments
      WHERE driver_id = $1
        AND delivery_status = 'delivered'
        AND date_trunc('week', assigned_at) = date_trunc('week', CURRENT_DATE)
    `, [driver.driver_id]);

    const weekStats = weekStatsResult[0] || {};

    res.json({
      ...driver,
      stats: {
        today: {
          deliveries: todayStats.deliveries_today || 0,
          earnings: parseFloat(todayStats.earnings_today || 0).toFixed(2)
        },
        week: {
          deliveries: weekStats.deliveries_week || 0,
          earnings: parseFloat(weekStats.earnings_week || 0).toFixed(2)
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// Assign driver to order (restaurant owner or admin)
exports.assignDriver = async (req, res, next) => {
  try {
    const { orderId, driverId } = req.body;

    await pool.query('SELECT * FROM sp_assign_driver($1, $2)', [orderId, driverId]);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// Get available drivers near restaurant
exports.getAvailableDrivers = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;

    // Note: This logic previously called a stored procedure.
    // Ensure the SP function signature matches: sp_get_available_drivers(restaurant_id, limit)
    await pool.query('SELECT * FROM sp_get_available_drivers($1, $2)', [restaurantId, 50]);

    const { rows: drivers } = await pool.query(`
      SELECT 
        d.driver_id,
        u.full_name,
        u.phone,
        d.vehicle_type,
        d.vehicle_model,
        d.completed_deliveries
      FROM Drivers d
      JOIN Users u ON d.user_id = u.user_id
      WHERE d.is_available = TRUE
      ORDER BY d.completed_deliveries DESC
      LIMIT 10
    `);

    res.json(drivers);
  } catch (err) {
    next(err);
  }
};
