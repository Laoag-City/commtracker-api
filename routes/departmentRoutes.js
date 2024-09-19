const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const authenticateJWT = require('../middlewares/authMiddleware');

// GET all departments (protected route)
router.get('/', authenticateJWT, departmentController.getAllDepartments);

// POST create a new department (protected route)
router.post('/new', authenticateJWT, departmentController.createDepartment);

module.exports = router;