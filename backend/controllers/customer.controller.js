const customerRepo = require('../repositories/customer.repo');
const userRepo = require('../repositories/user.repo');
const AppError = require('../utils/AppError');

exports.getProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Ensure customer can only access their own profile
    if (req.user.role === 'customer' && req.user.id !== parseInt(id)) {
      return next(new AppError('Forbidden', 403));
    }
    
    const user = await userRepo.findById(id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    const customer = await customerRepo.findByUserId(id);
    
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      customer: customer || null
    });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Ensure customer can only update their own profile
    if (req.user.role === 'customer' && req.user.id !== parseInt(id)) {
      return next(new AppError('Forbidden', 403));
    }
    
    const { name, phone } = req.body;
    
    await userRepo.update(id, { name, phone });
    
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    next(err);
  }
};
