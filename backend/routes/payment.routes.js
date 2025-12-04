const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/payment.controller');
const auth = require('../middlewares/auth');

router.post('/create-intent', auth, ctrl.createIntent);
router.post('/confirm', auth, ctrl.confirm);
router.get('/history', auth, ctrl.history);

module.exports = router;
