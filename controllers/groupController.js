const Group = require('../models/groupModel');
const Department = require('../models/departmentModel');
const logger = require('../utils/logger'); 

// Create a new group
exports.createGroup = async (req, res) => {
  const { groupName, departmentIds } = req.body;

  try {
    // Ensure departments exist
    const departments = await Department.find({ _id: { $in: departmentIds } });
    if (departments.length !== departmentIds.length) {
      return res.status(400).json({ message: 'One or more departments not found' });
    }

    // Create the group
    const newGroup = new Group({ groupName, departmentIds });
    await newGroup.save();

    res.status(201).json(newGroup);
  } catch (error) {
    res.status(500).json({ message: 'Error creating group', error: error.message });
  }
};

// Get all groups
exports.getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find().populate('departmentIds');
    res.status(200).json(groups);
    logger.info('Groups fetched successfully');
  } catch (error) {
    logger.error('Error fetching groups', { error: error.message });
    res.status(500).json({ message: 'Error fetching groups', error: error.message });
  }
};

// Get a single group by ID
exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate('departmentIds');
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching group', error: error.message });
  }
};

// Update a group
exports.updateGroup = async (req, res) => {
  const { groupName, departmentIds } = req.body;

  try {
    const departments = await Department.find({ _id: { $in: departmentIds } });
    if (departments.length !== departmentIds.length) {
      return res.status(400).json({ message: 'One or more departments not found' });
    }

    const group = await Group.findByIdAndUpdate(
      req.params.id,
      { groupName, departmentIds },
      { new: true }
    ).populate('departmentIds');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ message: 'Error updating group', error: error.message });
  }
};

// Delete a group
exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findByIdAndDelete(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    res.status(200).json({ message: 'Group deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting group', error: error.message });
  }
};
