const Payment = require('../models/Payment');
const Order = require('../models/Order');

exports.createIntent = async (req,res) => {
  // For real integration: call Stripe/PayPal to create intent
  const { orderId, amount, provider='mock' } = req.body;
  const p = await Payment.create({ order: orderId, amount, provider, status: 'pending' });
  res.json({ clientSecret: 'mock_secret', payment: p });
};

exports.confirm = async (req,res) => {
  const { paymentId, status } = req.body;
  const p = await Payment.findByIdAndUpdate(paymentId, { status }, { new:true });
  if(p && status === 'succeeded') {
    await Order.findByIdAndUpdate(p.order, { status: 'on_the_way' });
  }
  res.json(p);
};

exports.history = async (req,res) => {
  const list = await Payment.find().populate('order');
  res.json(list);
};
