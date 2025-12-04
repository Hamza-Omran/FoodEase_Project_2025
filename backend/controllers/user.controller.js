const User = require('../models/User');
const AppError = require('../utils/AppError');

exports.getProfile = async (req,res,next) => res.json({ user: req.user });

exports.updateProfile = async (req,res,next) => {
  const user = await User.findByIdAndUpdate(req.user._id, req.body, { new:true }).select('-password');
  res.json({ user });
};

exports.updatePassword = async (req,res,next) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  if(!await user.matchPassword(oldPassword)) return next(new AppError('Wrong old password',400));
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated' });
};

// admin actions
exports.listUsers = async (req,res) => {
  const users = await User.find().select('-password');
  res.json(users);
};

exports.changeRole = async (req,res) => {
  const { id } = req.params;
  const { role } = req.body;
  const u = await User.findByIdAndUpdate(id, { role }, { new:true }).select('-password');
  res.json(u);
};

exports.getUserById = async (req,res)=> {
  const u = await User.findById(req.params.id).select('-password');
  res.json(u);
};

exports.deleteUser = async (req,res)=> {
  await User.findByIdAndDelete(req.params.id);
  res.json({ success:true });
};
