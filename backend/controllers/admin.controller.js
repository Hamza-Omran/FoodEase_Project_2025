const User = require('../models/User');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');

exports.overview = async (req,res) => {
  const usersCount = await User.countDocuments();
  const ordersCount = await Order.countDocuments();
  const restaurantsCount = await Restaurant.countDocuments();
  res.json({ usersCount, ordersCount, restaurantsCount });
};

exports.analytics = async (req,res) => {
  // simple weekly orders count (example)
  const oneWeekAgo = new Date(Date.now() - 7*24*3600*1000);
  const recentOrders = await Order.find({ createdAt: { $gte: oneWeekAgo } });
  res.json({ recentOrdersCount: recentOrders.length, recentOrders });
};
