const Department = require('../models/departmentModel');
const logger = require('../utils/logger'); // Assuming you have a logger

// Get all departments
exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    res.status(200).json(departments);
    logger.info('Departments fetched successfully');
  } catch (error) {
    logger.error('Error fetching departments', { error: error.message });
    res.status(500).json({ message: 'Error fetching departments' });
  }
};

// Create a new department
exports.createDepartment = async (req, res) => {
  const { deptCode, deptName } = req.body;

  if (!deptCode || !deptName) {
    return res.status(400).json({ message: 'deptCode and deptName are required' });
  }

  try {
    const existingDept = await Department.findOne({ deptCode });
    if (existingDept) {
      return res.status(400).json({ message: `Department with code ${deptCode} already exists.` });
    }

    const newDepartment = new Department({ deptCode, deptName });
    await newDepartment.save();
    res.status(201).json(newDepartment);
    logger.info('Department created successfully', { deptCode, deptName });
  } catch (error) {
    logger.error('Error creating department', { error: error.message });
    res.status(500).json({ message: 'Error creating department' });
  }
};
