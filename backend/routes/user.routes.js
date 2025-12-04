const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const AppError = require('../utils/AppError');

exports.register = async (req,res,next) => {
  try {
    const { name,email,password,role } = req.body;
    if(await User.findOne({ email })) return next(new AppError('Email exists',400));
    const user = await User.create({ name, email, password, role });
    const token = generateToken(user);
    res.status(201).json({ user: { id:user._id, name:user.name, email:user.email, role:user.role }, token });
  } catch(err){ next(err); }
};

exports.login = async (req,res,next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if(!user) return next(new AppError('Invalid credentials',401));
    const ok = await user.matchPassword(password);
    if(!ok) return next(new AppError('Invalid credentials',401));
    const token = generateToken(user);
    res.json({ user: { id:user._id, name:user.name, email:user.email, role:user.role }, token });
  } catch(err){ next(err); }
};

exports.logout = async (req,res)=> res.json({ message:'Logged out (client should drop token)' });

exports.me = async (req,res)=> {
  res.json({ user: req.user });
};
