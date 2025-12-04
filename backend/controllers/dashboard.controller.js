const Order = require('../models/Order');

exports.stats = async (req,res) => {
  // if owner, filter by their restaurants (simplified)
  // For simplicity, return counts by status
  const byStatus = await Order.aggregate([{ $group: { _id: '$status', count: { $sum:1 } } }]);
  res.json({ byStatus });
};
