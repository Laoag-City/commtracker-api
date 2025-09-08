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
/*const multer = require('multer');

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 64 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      console.error(`Unsupported file type attempted: ${file.mimetype}`);
      cb(new Error('Only PDF and image files are allowed'));
    }
  },
}).fields([
  { name: 'file', maxCount: 1 },
  // { name: 'fromName' },
  // { name: 'documentTitle' },
  // { name: 'dateReceived' },
  // { name: 'username' },
  // { name: 'recipient[0][receiveDate]' },
  // { name: 'recipient[0][receivingDepartment]' },
  // { name: 'recipient[0][status]' },
  // { name: 'recipient[0][remarks]' },
  // { name: 'recipient[1][receiveDate]' },
  // { name: 'recipient[1][receivingDepartment]' },
  // { name: 'recipient[1][status]' },
  // { name: 'recipient[1][remarks]' },
  // { name: 'recipient[2][receiveDate]' },
  // { name: 'recipient[2][receivingDepartment]' },
  // { name: 'recipient[2][status]' },
  // { name: 'recipient[2][remarks]' },
  // { name: 'recipient[3][receiveDate]' },
  // { name: 'recipient[3][receivingDepartment]' },
  // { name: 'recipient[3][status]' },
  // { name: 'recipient[3][remarks]' },
]);

module.exports = upload;*/