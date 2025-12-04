const AppError = require('../utils/AppError');

module.exports = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Not authenticated', 401));
  }
  
  // Map 'owner' to 'restaurant_owner' for compatibility
  const userRole = req.user.role === 'restaurant_owner' ? 'owner' : req.user.role;
  const allowedRoles = roles.map(r => r === 'owner' ? 'restaurant_owner' : r);
  
  if (!allowedRoles.includes(req.user.role) && !roles.includes(userRole)) {
    return next(new AppError('Forbidden', 403));
  }
  
  next();
};