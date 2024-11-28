const multer = require('multer');

// Configure multer for file upload
const storage = multer.memoryStorage(); // Storing files in memory as Buffer
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: (req, file, cb) => {
    // Allow only certain file types (example: PDFs and images)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'));
    }
  },
});

module.exports = upload;
