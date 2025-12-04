const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');


module.exports = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return next(new AppError('Not authenticated', 401));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded; // { id, role, full_name, ... }
    next();
  } catch (err) {
    next(new AppError('Invalid token', 401));
  }
};