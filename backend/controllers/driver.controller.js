const pool = require('../config/db');
const AppError = require('../utils/AppError');

// Get driver profile by user_id
exports.getDriverProfile = async (req, res, next) => {
  try {
    const { id } = req.params; // user_id

    const [drivers] = await pool.query(`
      SELECT 
        d.*,
        u.full_name,
        u.email,
        u.phone
      FROM Drivers d
      JOIN Users u ON d.user_id = u.user_id
      WHERE d.user_id = ?
    `, [id]);

    if (!drivers[0]) {
      return next(new AppError('Driver not found', 404));
    }

    res.json(drivers[0]);
  } catch (err) {
    next(err);
  }
};

// Get logged-in driver's profile
exports.getMyProfile = async (req, res, next) => {
  try {
    const [drivers] = await pool.query(`
      SELECT 
        d.*,
        u.full_name,
        u.email,
        u.phone
      FROM Drivers d
      JOIN Users u ON d.user_id = u.user_id
      WHERE d.user_id = ?
    `, [req.user.id]);

    if (!drivers[0]) {
      return next(new AppError('Driver profile not found', 404));
    }

    res.json(drivers[0]);
  } catch (err) {
    next(err);
  }
};

// Update driver location
exports.updateLocation = async (req, res, next) => {
  try {
    const { driverId } = req.params;
    const { latitude, longitude } = req.body;

    await pool.query(
      'UPDATE Drivers SET current_latitude = ?, current_longitude = ?, updated_at = NOW() WHERE driver_id = ?',
      [latitude, longitude, driverId]
    );

    res.json({ success: true, message: 'Location updated' });
  } catch (err) {
    next(err);
  }
};

// Toggle driver availability
exports.toggleAvailability = async (req, res, next) => {
  try {
    const { driverId } = req.params;
    const { is_available } = req.body;

    await pool.query(
      'UPDATE Drivers SET is_available = ? WHERE driver_id = ?',
      [is_available, driverId]
    );

    res.json({ success: true, is_available });
  } catch (err) {
    next(err);
  }
};
