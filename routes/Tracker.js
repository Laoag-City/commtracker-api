const express = require('express');
const mongoose = require('mongoose');
const { GridFSBucket } = mongoose.mongo;
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const commTrackersController = require('../controllers/Tracker');
const authenticateJWT = require('../middlewares/authMiddleware');
const upload = require('../middlewares/fileUpload');
const { validateCreateTracker, validateTrackerId } = require('../middlewares/validateRequest');

// Router instance
const router = express.Router();

// Rate limiting: limit 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 100 requests per windowMs
  message: { message: 'Too many requests from this IP, please try again later.' },
});

// CRUD Routes


router.post(
  '/new',
  authenticateJWT,
  upload.single('file'),
  //upload,
  validateCreateTracker,
  commTrackersController.createTracker
); // Create


router.get('/', authenticateJWT, limiter, commTrackersController.getAllTrackers); // Read All


router.get('/filter/department', authenticateJWT, commTrackersController.filterReceivingDepartments); // Filter by receivingDepartment

router.get('/audittrail/:id', authenticateJWT, validateTrackerId, commTrackersController.getAuditTrail); // Audit Trail


router.get('/:id', authenticateJWT, validateTrackerId, commTrackersController.getTrackerById); // Read One


router.put(
  '/:id',
  authenticateJWT,
  upload.single('file'),
  //upload,
  validateTrackerId,
  commTrackersController.updateTrackerById
); // Update


router.put(
  '/:id/recipient/:recipientid',
  authenticateJWT,
  validateTrackerId,
  commTrackersController.updateRecipientByTrackerId
); // Update Recipient


router.delete('/:id', authenticateJWT, validateTrackerId, commTrackersController.deleteTrackerById); // Delete

// Serve Attachment Routes


router.get(
  '/:id/attachment',
  authenticateJWT,
  validateTrackerId,
  commTrackersController.getAttachment
); // Serve attachment


router.get(
  '/:id/attachmentwithauth',
  authenticateJWT,
  validateTrackerId,
  commTrackersController.getAttachmentWithAuth
); // Serve attachment with extra auth

// Stream file from GridFS by ObjectId
router.get('/files/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid file ID format" });
    }

    const fileId = new mongoose.Types.ObjectId(req.params.id);
    const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: "attachments" });

    const downloadStream = bucket.openDownloadStream(fileId);

    // Handle stream errors
    downloadStream.on("error", (err) => {
      console.error("Error streaming file:", err);
      return res.status(404).json({ message: "File not found" });
    });

    // Set response headers for content type
    res.setHeader("Content-Type", req.query.mimeType || "application/octet-stream");

    // Stream file data to the client
    downloadStream.pipe(res);
  } catch (err) {
    console.error("Error fetching file:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Unauthenticated Route for Tracker Status

router.get('/status/:id', limiter, validateTrackerId, commTrackersController.getTrackerStatusById); // Get tracker status

// Error handling middleware for file uploads
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  } else if (err.message === 'Only PDF and image files are allowed') {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});
module.exports = router;
