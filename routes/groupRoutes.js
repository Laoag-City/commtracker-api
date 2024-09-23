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

/* const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const authenticateJWT = require('../middlewares/auth');

// CRUD operations for departments
router.get('/', authenticateJWT, departmentController.getAllDepartments); // Get all departments
router.get('/:id', authenticateJWT, departmentController.getDepartmentById); // Get a department by ID
router.post('/', authenticateJWT, departmentController.createDepartment); // Create a new department
router.put('/:id', authenticateJWT, departmentController.updateDepartment); // Update a department by ID
router.delete('/:id', authenticateJWT, departmentController.deleteDepartment); // Delete a department by ID

module.exports = router;
 */