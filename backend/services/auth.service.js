const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');
const userRepo = require('../repositories/user.repo');
const AppError = require('../utils/AppError');

const VALID_ROLES = ['customer', 'restaurant_owner', 'employee', 'driver', 'admin'];

async function register({ name, email, phone, password, role = 'customer' }) {
  if (!VALID_ROLES.includes(role)) {
    throw new AppError('Invalid role', 400);
  }

  const existing = await userRepo.findByEmail(email);
  if (existing) {
    throw new AppError('Email already in use', 400);
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await userRepo.create({
    email,
    password_hash: hash,
    role,
    phone: phone || null,
    full_name: name,
  });

  // For customer role, a Customers row will be auto-created by trigger trg_create_customer_profile

  const token = generateToken({
    id: user.user_id,
    role: user.role,
    name: user.full_name,
  });

  return {
    user: {
      id: user.user_id,
      name: user.full_name,
      email: user.email,
      role: user.role,
    },
    token,
  };
}

async function login({ email, password }) {
  const user = await userRepo.findByEmail(email);
  if (!user) throw new AppError('Invalid email or password', 401);

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw new AppError('Invalid email or password', 401);

  const token = generateToken({
    id: user.user_id,
    role: user.role,
    name: user.full_name,
  });

  return {
    user: {
      id: user.user_id,
      name: user.full_name,
      email: user.email,
      role: user.role,
    },
    token,
  };
}

async function getMe(userId) {
  const user = await userRepo.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  return {
    id: user.user_id,
    name: user.full_name,
    email: user.email,
    role: user.role,
  };
}

module.exports = { register, login, getMe };