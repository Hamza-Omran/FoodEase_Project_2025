const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect, restrictTo } = require('../middlewares/auth');

// All admin routes require admin role
router.use(protect, restrictTo('admin'));

// System overview
router.get('/overview', adminController.getSystemOverview);

// ============================================
// RESTAURANT MANAGEMENT
// ============================================
router.get('/restaurants', adminController.getAllRestaurants);
router.get('/restaurants/:id', adminController.getRestaurant);
router.post('/restaurants', adminController.createRestaurant);
router.put('/restaurants/:id', adminController.updateRestaurant);
router.delete('/restaurants/:id', adminController.deleteRestaurant);
router.patch('/restaurants/:id/status', adminController.updateRestaurant);

// ============================================
// DRIVER MANAGEMENT
// ============================================
router.get('/drivers', adminController.getAllDrivers);
router.get('/drivers/:id', adminController.getDriver);
router.post('/drivers', adminController.createDriver);
router.put('/drivers/:id', adminController.updateDriver);
router.delete('/drivers/:id', adminController.deleteDriver);

module.exports = router;
