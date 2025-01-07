// routes/Tracker.js
const express = require('express');
const commTrackersController = require('../controllers/Tracker');
const authenticateJWT = require('../middlewares/authMiddleware');
const upload = require('../middlewares/fileUpload');
const { validateCreateTracker, validateTrackerId } = require('../middlewares/validateRequest');

const router = express.Router();

// CRUD Routes
router.post(
  '/new',
  authenticateJWT,
  upload.single('attachment'), // Middleware for handling file upload
  validateCreateTracker,       // Middleware for request validation
  commTrackersController.createTracker
); // Create

router.get('/', authenticateJWT, commTrackersController.getAllTrackers); // Read All

router.get(
  '/:id',
  authenticateJWT,
  validateTrackerId,            // Middleware for validating ID
  commTrackersController.getTrackerById
); // Read One

router.put(
  '/:id',
  authenticateJWT,
  upload.single('attachment'), // File upload middleware (if updating attachment)
  validateTrackerId,          // Validate ID
  commTrackersController.updateTrackerById
); // Update

router.put(
  '/:id/recipients/:recipientid',
  authenticateJWT,
  validateTrackerId,          // Validate ID
  commTrackersController.updateRecipientByTrackerId
); // Update recipient using Tracker ID

router.delete(
  '/:id',
  authenticateJWT,
  validateTrackerId,          // Validate ID
  commTrackersController.deleteTrackerById
); // Delete

// Serve attachment for a specific tracker
router.get(
  '/:id/attachment',
  authenticateJWT,           // Ensure the user is authenticated
  validateTrackerId,         // Ensure the ID is valid
  commTrackersController.getAttachment // Controller logic for serving the attachment
);

// Serve attachment with auth for a specific tracker
router.get(
  '/:id/attachmentwithauth',
  authenticateJWT,           // Ensure the user is authenticated
  validateTrackerId,         // Ensure the ID is valid
  commTrackersController.getAttachmentWithAuth // Controller logic for serving the attachment
);

// Serve unauthenticated tracker to check status
router.get(
  '/status/:id',
  validateTrackerId,         // Ensure the ID is valid
  commTrackersController.getTrackerStatusById
); 

// Error handling middleware for file uploads
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});
module.exports = router;
