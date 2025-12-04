const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/review.controller');
const auth = require('../middlewares/auth');

router.post('/', auth, ctrl.add);
router.get('/meal/:mealId', ctrl.listByMeal);
router.delete('/:id', auth, ctrl.remove); // auth + role check can be added

module.exports = router;
