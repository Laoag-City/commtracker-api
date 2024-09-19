const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const authenticateJWT = require('../middlewares/auth');

// Protected route to get all departments
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const departments = await Department.find();
    res.status(200).json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching departments' });
  }
});

// Optional: Route to add a new department (for testing/adding data)
router.post('/', authenticateJWT, async (req, res) => {
  const { deptCode, DeptName } = req.body;

  if (!deptCode || !DeptName) {
    return res.status(400).json({ message: 'deptCode and DeptName are required' });
  }

  try {
    const newDepartment = new Department({ deptCode, DeptName });
    await newDepartment.save();
    res.status(201).json(newDepartment);
  } catch (error) {
    res.status(500).json({ message: 'Error creating department' });
  }
});

module.exports = router;
