const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/category.controller');
const auth = require('../middlewares/auth');
const roles = require('../middlewares/roles');

router.post('/restaurants/:restaurant_id/categories', auth, roles('owner','admin'), ctrl.create);
router.get('/restaurants/:restaurant_id/categories', ctrl.list);
router.put('/categories/:id', auth, roles('owner','admin'), ctrl.update);
router.delete('/categories/:id', auth, roles('admin'), ctrl.remove);

module.exports = router;