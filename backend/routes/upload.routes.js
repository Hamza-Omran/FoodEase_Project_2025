const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const { protect, restrictTo } = require('../middlewares/auth');

// Upload single image
router.post('/image', protect, restrictTo('restaurant_owner', 'admin'), upload.single, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const fileUrl = `/uploads/${req.body.type || 'general'}/${req.file.filename}`;

  res.json({
    success: true,
    url: fileUrl,
    filename: req.file.filename
  });
});

// Upload multiple images
router.post('/images', protect, restrictTo('restaurant_owner', 'admin'), upload.array, (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded' });
  }

  const urls = req.files.map(file => `/uploads/${req.body.type || 'general'}/${file.filename}`);

  res.json({
    success: true,
    urls,
    count: req.files.length
  });
});

module.exports = router;
