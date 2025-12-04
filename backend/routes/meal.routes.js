const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/meal.controller');
const auth = require('../middlewares/auth');
const roles = require('../middlewares/roles');

router.post('/', auth, roles('owner','admin'), ctrl.create);
router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.get('/restaurant/:restaurantId', ctrl.listByRestaurant);
router.put('/:id', auth, roles('owner','admin'), ctrl.update);
router.delete('/:id', auth, roles('owner','admin'), ctrl.remove);

module.exports = router;
