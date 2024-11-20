const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/Department');
const authenticateJWT = require('../middlewares/authMiddleware');

// GET all departments (protected route)
router.get('/', authenticateJWT, departmentController.getAllDepartments);
// Get a department by ID
router.get('/:id', authenticateJWT, departmentController.getDepartmentById); 
// POST create a new department (protected route)
router.post('/new', authenticateJWT, departmentController.createDepartment);
// Create a new department
router.put('/:id', authenticateJWT, departmentController.updateDepartment); 
router.delete('/:id', authenticateJWT, departmentController.deleteDepartment); 

module.exports = router;
