const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const env = require('../config/env');
const AppError = require('../utils/AppError');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// Register new user
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return next(new AppError('Please provide name, email and password', 400));
    }

    // Validate role
    const validRoles = ['customer', 'restaurant_owner', 'driver', 'employee', 'admin'];
    const userRole = role || 'customer';

    if (!validRoles.includes(userRole)) {
      return next(new AppError('Invalid role', 400));
    }

    // Check if user exists
    const [existingUsers] = await pool.query(
      'SELECT user_id FROM Users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return next(new AppError('Email already registered', 400));
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await pool.query(
      `INSERT INTO Users (email, password_hash, full_name, phone, role, is_active) 
       VALUES (?, ?, ?, ?, ?, TRUE)`,
      [email, passwordHash, name, phone || null, userRole]
    );

    const userId = result.insertId;

    // Generate token
    const token = generateToken(userId);

    // Get user data
    const [users] = await pool.query(
      'SELECT user_id, email, full_name, role, phone FROM Users WHERE user_id = ?',
      [userId]
    );

    const user = users[0];

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.user_id,
        name: user.full_name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (err) {
    next(err);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    // Get user
    const [users] = await pool.query(
      'SELECT user_id, email, password_hash, full_name, role, phone, is_active FROM Users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return next(new AppError('Invalid email or password', 401));
    }

    const user = users[0];

    // Check if user is active
    if (!user.is_active) {
      return next(new AppError('Account is inactive', 401));
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return next(new AppError('Invalid email or password', 401));
    }

    // Last login tracking removed (column doesn't exist)

    // Generate token
    const token = generateToken(user.user_id);

    res.json({
      success: true,
      token,
      user: {
        id: user.user_id,
        name: user.full_name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (err) {
    next(err);
  }
};

// Get current user
exports.getMe = async (req, res, next) => {
  try {
    const [users] = await pool.query(
      'SELECT user_id, email, full_name, role, phone FROM Users WHERE user_id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return next(new AppError('User not found', 404));
    }

    const user = users[0];

    res.json({
      success: true,
      user: {
        id: user.user_id,
        name: user.full_name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (err) {
    next(err);
  }
};

// Logout (client-side token removal)
exports.logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};
