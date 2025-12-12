const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dohg8ini6',
    api_key: process.env.CLOUDINARY_API_KEY || '779645829788358',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'bdWt2sUpHtB0ko4bXz6MYcOF8I8'
});

module.exports = cloudinary;
