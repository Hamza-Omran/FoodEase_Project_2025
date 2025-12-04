const restaurantRepo = require('../repositories/restaurant.repo');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

exports.create = async (req, res, next) => {
  try {
    const data = { ...req.body, owner_id: req.user.id };
    const restaurant = await restaurantRepo.create(data);
    res.status(201).json(restaurant);
  } catch (err) {
    next(err);
  }
};

exports.listRestaurants = asyncHandler(async (req, res) => {
  const restaurants = await restaurantRepo.list();
  res.json(restaurants);
});

exports.getRestaurantById = asyncHandler(async (req, res) => {
  const restaurant = await restaurantRepo.get(req.params.id);
  if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
  res.json(restaurant);
});

exports.getRestaurantMenu = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM Menu_Items WHERE restaurant_id = ? AND is_available = TRUE',
    [req.params.id]
  );
  res.json(rows);
});

exports.getRestaurantCategories = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM Menu_Categories WHERE restaurant_id = ? AND is_active = TRUE ORDER BY display_order',
    [req.params.id]
  );
  res.json(rows);
});

exports.update = async (req, res, next) => {
  try {
    const restaurant = await restaurantRepo.update(req.params.id, req.body);
    res.json(restaurant);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await restaurantRepo.remove(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
