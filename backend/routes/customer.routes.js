const express = require('express');
const router = express.Router();
const addressCtrl = require('../controllers/address.controller');
const customerCtrl = require('../controllers/customer.controller');
const auth = require('../middlewares/auth');
const roles = require('../middlewares/roles');

// Customer profile
router.get('/:id/profile', auth, roles('customer'), customerCtrl.getProfile);
router.put('/:id/profile', auth, roles('customer'), customerCtrl.updateProfile);

// Customer address routes
router.get('/:id/addresses', auth, addressCtrl.getAddresses);
router.post('/:id/addresses', auth, addressCtrl.addAddress);
router.put('/:id/addresses/:addressId', auth, addressCtrl.updateAddress);
router.delete('/:id/addresses/:addressId', auth, addressCtrl.deleteAddress);

module.exports = router;

