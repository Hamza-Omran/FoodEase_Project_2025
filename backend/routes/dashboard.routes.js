const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboard.controller');
const auth = require('../middlewares/auth');
const roles = require('../middlewares/roles');

router.get('/stats', auth, roles('owner','admin'), ctrl.stats);

module.exports = router;
