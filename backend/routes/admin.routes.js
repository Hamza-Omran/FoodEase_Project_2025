const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/admin.controller');
const auth = require('../middlewares/auth');
const roles = require('../middlewares/roles');

router.get('/overview', auth, roles('admin'), ctrl.overview);
router.get('/analytics', auth, roles('admin'), ctrl.analytics);

module.exports = router;
