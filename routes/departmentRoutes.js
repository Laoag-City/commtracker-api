const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const authenticateJWT = require('../middlewares/authMiddleware');

// GET all departments (protected route)
router.get('/', authenticateJWT, departmentController.getAllDepartments);
// Get a department by ID
router.get('/:id', authenticateJWT, departmentController.getDepartmentById); 

// POST create a new department (protected route)
router.post('/new', authenticateJWT, departmentController.createDepartment);
// Create a new department
//router.post('/', authenticateJWT, departmentController.createDepartment); 

// Update a department by ID
router.put('/:id', authenticateJWT, departmentController.updateDepartment); 
router.delete('/:id', authenticateJWT, departmentController.deleteDepartment); 
router.delete('/:id', authenticateJWT, departmentController.deleteDepartment);

module.exports = router;

/* const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const authenticateJWT = require('../middlewares/auth');

// CRUD operations for departments
router.get('/', authenticateJWT, departmentController.getAllDepartments); // Get all departments
router.get('/:id', authenticateJWT, departmentController.getDepartmentById);
router.post('/', authenticateJWT, departmentController.createDepartment); // Create a new department
router.put('/:id', authenticateJWT, departmentController.updateDepartment); // Update a department by ID
router.delete('/:id', authenticateJWT, departmentController.deleteDepartment); // Delete a department by ID

module.exports = router;
 */