const multer = require('multer');
const path = require('path');
const AppError = require('../utils/AppError');

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image! Please upload only images.', 400), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5 // 5MB limit
    }
});

// Export a middleware that handles single file upload with field name 'image'
// But the route uses upload.single, which suggests upload is the multer instance or a wrapper.
// In route: upload.single
// So I should export an object with single method, or just the multer instance.
// The route calls `upload.single`. Multer instance has `.single()`.
// But wait, `upload.single` in route usage: `upload.single` (as a property access? or function call?)
// Route: `router.post('/image', ..., upload.single, ...)`
// Usually it's `upload.single('image')`.
// Let's check the route again.

// Route line 7: `router.post('/image', ..., upload.single, ...)`
// If `upload` is the multer instance, `upload.single` is a function that returns middleware.
// It should be called like `upload.single('image')`.
// If the route passes `upload.single` directly, it might be wrong unless `upload.single` is a pre-configured middleware.

// Let's assume I should export an object with a `single` property that IS the middleware.
// OR, I should fix the route to call `.single('image')`.

// Let's check the route usage again.
// `upload.single` is passed as a handler.
// If `upload` is `{ single: multerInstance.single('image') }`, then it works.

// However, usually one exports the multer instance.
// Let's look at how I should implement it.
// I'll create a wrapper.

const uploadMiddleware = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 5 }
});

module.exports = {
    single: uploadMiddleware.single('image'),
    array: uploadMiddleware.array('images', 5),
    any: uploadMiddleware.any()
};
