const Meal = require('../models/Meal');
exports.create = async (req,res) => {
  const body = req.body; // ensure restaurant field present or owner
  const m = await Meal.create(body);
  res.status(201).json(m);
};
exports.list = async (req,res) => res.json(await Meal.find());
exports.get = async (req,res) => res.json(await Meal.findById(req.params.id));
exports.listByRestaurant = async (req,res) => res.json(await Meal.find({ restaurant: req.params.restaurantId }));
exports.update = async (req,res) => res.json(await Meal.findByIdAndUpdate(req.params.id, req.body, { new:true }));
exports.remove = async (req,res) => { await Meal.findByIdAndDelete(req.params.id); res.json({ success:true }); };
