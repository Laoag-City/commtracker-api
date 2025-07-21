const multer = require('multer');

// Configure Multer for in-memory storage
const storage = multer.memoryStorage();

// Initialize Multer middleware
const upload = multer({
  storage,
  limits: { fileSize: 64 * 1024 * 1024 }, // 50MB file size limit
  fileFilter: (req, file, cb) => {
    // Allowed MIME types
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      console.error(`Unsupported file type attempted: ${file.mimetype}`);
      cb(new Error('Only PDF and image files are allowed')); // Reject file
    }
  },
});

// Export the configured Multer middleware
module.exports = upload;