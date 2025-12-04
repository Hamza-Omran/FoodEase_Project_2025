const express = require('express');
const router = express.Router();
const menuCtrl = require('../controllers/menu.controller');
const auth = require('../middlewares/auth');
const roles = require('../middlewares/roles');

// Get menu items for a restaurant (no auth required)
router.get('/restaurants/:restaurantId/menu', menuCtrl.getMenuItems);

// Get single menu item (no auth required)
router.get('/menu/:menuItemId', menuCtrl.getMenuItem);

// Create menu item (owner auth required)
router.post('/restaurants/:restaurantId/menu', auth, roles('owner', 'admin'), menuCtrl.createMenuItem);

// Update menu item (owner auth required)
router.put('/restaurants/:restaurantId/menu/:itemId', auth, roles('owner', 'admin'), menuCtrl.updateMenuItem);

// Delete menu item (owner auth required)
router.delete('/restaurants/:restaurantId/menu/:itemId', auth, roles('owner', 'admin'), menuCtrl.deleteMenuItem);

module.exports = router;

