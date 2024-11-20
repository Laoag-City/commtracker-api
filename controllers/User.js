const User = require('../models/User');
const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

const secretKey = config.jwtSecret;

// Register User (Create)
exports.register = async (req, res) => {
  try {
    const { username, password, userrole, deptId } = req.body;

    // Create a new user, including deptId
    const user = new User({ username, password, userrole, deptId });
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { _id: user._id.toString(), deptId: user.deptId },
      secretKey,
      { expiresIn: '1d' }
    );

    // Send user data with token
    res.status(201).send({ user, token });
    logger.info('User registered successfully', { userId: user._id });
  } catch (error) {
    logger.error('User registration failed', { error: error.message });
    res.status(400).send({ error: error.message });
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the user by username
    const user = await User.findOne({ username }).populate('deptId');
    if (!user || !(await user.comparePassword(password))) {
      logger.warn('Login failed due to incorrect username or password', { username });
      return res.status(401).json({ message: 'Incorrect username or password' });  // Fix: Return 401 for incorrect credentials
    }

    // Generate JWT with deptId included
    const token = jwt.sign(
      { _id: user._id, username: user.username, deptId: user.deptId },
      secretKey,
      { expiresIn: '1d' }
    );

    // Send user details and token
    res.send({ _id: user._id, username: user.username, userrole: user.userrole, deptId: user.deptId, token });
    logger.info('User logged in successfully', { userId: user._id });
  } catch (error) {
    logger.error('Login failed', { error: error.message });
    res.status(400).send({ error: error.message });
  }
};

// Get All Users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().populate('deptId');
    res.status(200).json(users);
    logger.info('Users fetched successfully');
  } catch (error) {
    logger.error('Error fetching users', { error: error.message });
    res.status(500).json({ message: 'Error fetching users' });
  }
};

// Get User by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('deptId');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
    logger.info('User fetched successfully', { userId: user._id });
  } catch (error) {
    // Handle malformed ObjectId
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    logger.error('Error fetching user', { error: error.message });
    res.status(500).json({ message: 'Error fetching user' });
  }
};
// Update User by ID
exports.updateUser = async (req, res) => {
  const { username, password, userrole, deptId } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.username = username || user.username;
    if (password) {
      user.password = password;  // This will trigger the 'pre' save hook to hash the password
    }
    user.userrole = userrole || user.userrole;
    user.deptId = deptId || user.deptId;

    await user.save();

    res.status(200).json(user);
    logger.info('User updated successfully', { userId: user._id });
  } catch (error) {
    logger.error('Error updating user', { error: error.message });
    res.status(500).json({ message: 'Error updating user' });
  }
};

// Delete User by ID
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
    logger.info('User deleted successfully', { userId: user._id });
  } catch (error) {
    logger.error('Error deleting user', { error: error.message });
    res.status(500).json({ message: 'Error deleting user' });
  }
};