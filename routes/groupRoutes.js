const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const authenticateJWT = require('../middlewares/authMiddleware');

// CRUD routes for groups
router.post('/', authenticateJWT, groupController.createGroup); // Create a group
router.get('/', authenticateJWT, groupController.getAllGroups); // Get all groups
router.get('/:id', authenticateJWT, groupController.getGroupById); // Get a group by ID
router.put('/:id', authenticateJWT, groupController.updateGroup); // Update a group
router.delete('/:id', authenticateJWT, groupController.deleteGroup); // Delete a group

module.exports = router;

