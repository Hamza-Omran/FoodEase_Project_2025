const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const addressController = require('../controllers/address.controller');
const { protect } = require('../middlewares/auth');

router.use(protect);

router.get('/:id/profile', customerController.getProfile);
router.put('/:id/profile', customerController.updateProfile);

router.get('/:id/addresses', addressController.getAddresses);
router.post('/:id/addresses', addressController.addAddress);
router.put('/:id/addresses/:addressId', addressController.updateAddress);
router.delete('/:id/addresses/:addressId', addressController.deleteAddress);

module.exports = router;

