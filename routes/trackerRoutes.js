const express = require('express');
const router = express.Router();
const trackerController = require('../controllers/trackerController');
const authenticateJWT = require('../middlewares/authMiddleware');

// CRUD operations for trackers
router.post('/', authenticateJWT, trackerController.createTracker); // Create a new tracker
router.get('/', authenticateJWT, trackerController.getAllTrackers); // Get all trackers
router.get('/:id', authenticateJWT, trackerController.getTrackerById); // Get a tracker by ID
router.put('/:id', authenticateJWT, trackerController.updateTracker); // Update a tracker by ID
router.delete('/:id', authenticateJWT, trackerController.deleteTracker); // Delete a tracker by ID

module.exports = router;
