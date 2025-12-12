const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const { protect, restrictTo } = require('../middlewares/auth');

// Upload single image
router.post('/image', protect, restrictTo('restaurant_owner', 'admin'), upload.single, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  // Cloudinary returns the uploaded file info in req.file
  res.json({
    success: true,
    url: req.file.path, // Cloudinary URL
    filename: req.file.filename,
    cloudinary_id: req.file.filename // Cloudinary public_id for deletion
  });
});

// Upload multiple images
router.post('/images', protect, restrictTo('restaurant_owner', 'admin'), upload.array, (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded' });
  }

  const uploadedFiles = req.files.map(file => ({
    url: file.path, // Cloudinary URL
    filename: file.filename,
    cloudinary_id: file.filename
  }));

  res.json({
    success: true,
    files: uploadedFiles,
    count: req.files.length
  });
});

module.exports = router;
