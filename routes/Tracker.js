const express = require('express');
const rateLimit = require('express-rate-limit');
const commTrackersController = require('../controllers/Tracker');
const authenticateJWT = require('../middlewares/authMiddleware');
const upload = require('../middlewares/fileUpload');
const { validateCreateTracker, validateTrackerId } = require('../middlewares/validateRequest');

// Router instance
const router = express.Router();

// Rate limiting: limit 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { message: 'Too many requests from this IP, please try again later.' },
});

// CRUD Routes

/**
 * @swagger
 * /trackers/new:
 *   post:
 *     summary: Create a new tracker
 *     description: Create a tracker with optional attachment and validation
 */
router.post(
  '/new',
  authenticateJWT,
  upload.single('attachment'),
  validateCreateTracker,
  commTrackersController.createTracker
); // Create

/**
 * @swagger
 * /trackers:
 *   get:
 *     summary: Get all trackers
 *     description: Fetch a paginated list of trackers with optional search
 */
router.get('/', authenticateJWT, limiter, commTrackersController.getAllTrackers); // Read All

/**
 * @swagger
 * /trackers/filter/department:
 *   get:
 *     summary: Filter trackers by receiving department
 *     description: Filter recipient data using receiving department, status, or other parameters
 */
router.get('/filter/department', authenticateJWT, commTrackersController.filterReceivingDepartments); // Filter by receivingDepartment

/**
 * @swagger
 * /trackers/audittrail/{id}:
 *   get:
 *     summary: Get tracker audit trail
 *     description: Fetch the audit trail logs of a tracker
 */
router.get('/audittrail/:id', authenticateJWT, validateTrackerId, commTrackersController.getAuditTrail); // Audit Trail

/**
 * @swagger
 * /trackers/{id}:
 *   get:
 *     summary: Get tracker by ID
 *     description: Fetch a single tracker by its ID
 */
router.get('/:id', authenticateJWT, validateTrackerId, commTrackersController.getTrackerById); // Read One

/**
 * @swagger
 * /trackers/{id}:
 *   put:
 *     summary: Update a tracker
 *     description: Update a tracker, including its attachment
 */
router.put(
  '/:id',
  authenticateJWT,
  upload.single('attachment'),
  validateTrackerId,
  commTrackersController.updateTrackerById
); // Update

/**
 * @swagger
 * /trackers/{id}/recipients/{recipientid}:
 *   put:
 *     summary: Update a specific recipient in a tracker
 *     description: Update recipient status, remarks, and other data
 */
router.put(
  '/:id/recipients/:recipientid',
  authenticateJWT,
  validateTrackerId,
  commTrackersController.updateRecipientByTrackerId
); // Update Recipient

/**
 * @swagger
 * /trackers/{id}:
 *   delete:
 *     summary: Delete a tracker
 *     description: Permanently delete a tracker by its ID
 */
router.delete('/:id', authenticateJWT, validateTrackerId, commTrackersController.deleteTrackerById); // Delete

// Serve Attachment Routes

/**
 * @swagger
 * /trackers/{id}/attachment:
 *   get:
 *     summary: Download tracker attachment
 *     description: Serve the attachment of a specific tracker
 */
router.get(
  '/:id/attachment',
  authenticateJWT,
  validateTrackerId,
  commTrackersController.getAttachment
); // Serve attachment

/**
 * @swagger
 * /trackers/{id}/attachmentwithauth:
 *   get:
 *     summary: Download tracker attachment with extra authentication
 *     description: Serve the attachment of a specific tracker with additional auth
 */
router.get(
  '/:id/attachmentwithauth',
  authenticateJWT,
  validateTrackerId,
  commTrackersController.getAttachmentWithAuth
); // Serve attachment with extra auth

// Unauthenticated Route for Tracker Status

/**
 * @swagger
 * /trackers/status/{id}:
 *   get:
 *     summary: Get tracker status
 *     description: Fetch status-related data for a specific tracker
 */
router.get('/status/:id', limiter, validateTrackerId, commTrackersController.getTrackerStatusById); // Get tracker status

// Error handling middleware for file uploads
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

module.exports = router;
