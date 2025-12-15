const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const env = require('../config/env');


// Verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Not authenticated', 401));
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Fetch full user data including customer_id if role is 'customer'
    const [users] = await pool.query('SELECT * FROM Users WHERE user_id = ?', [decoded.id]);

    if (!users[0]) {
      return next(new AppError('User not found', 401));
    }

    req.user = {
      id: users[0].user_id,
      email: users[0].email,
      role: users[0].role,
      name: users[0].full_name
    };

    // If user is a customer, fetch their customer_id
    if (users[0].role === 'customer') {
      const [customers] = await pool.query(
        'SELECT customer_id FROM Customers WHERE user_id = ?',
        [users[0].user_id]
      );

      if (customers[0]) {
        req.user.customerId = customers[0].customer_id;

      } else {

      }
    }

    next();
  } catch (err) {
    console.error('Auth error:', err);
    return next(new AppError('Invalid token', 401));
  }
};

// Restrict to specific roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Forbidden', 403));
    }
    next();
  };
};