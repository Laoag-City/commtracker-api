const Department = require('../models/Department');
const logger = require('../utils/logger');

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

// Get a department by ID
exports.getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.status(200).json(department);
    logger.info('Department fetched successfully', { department });
  } catch (error) {
    logger.error('Error fetching department', { error: error.message });
    res.status(500).json({ message: 'Error fetching department' });
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

// Update a department by ID
exports.updateDepartment = async (req, res) => {
  const { deptCode, deptName } = req.body;

  if (!deptCode || !deptName) {
    return res.status(400).json({ message: 'deptCode and deptName are required' });
  }

  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { deptCode, deptName },
      { new: true, runValidators: true } // Return the updated document and validate the fields
    );

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.status(200).json(department);
    logger.info('Department updated successfully', { department });
  } catch (error) {
    logger.error('Error updating department', { error: error.message });
    res.status(500).json({ message: 'Error updating department' });
  }
};

// Delete a department by ID
exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.status(200).json({ message: 'Department deleted successfully' });
    logger.info('Department deleted successfully', { department });
  } catch (error) {
    logger.error('Error deleting department', { error: error.message });
    res.status(500).json({ message: 'Error deleting department' });
  }
};
