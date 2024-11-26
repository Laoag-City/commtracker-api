const User = require('../models/User');
const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');
//const { handleError } = require('../utils/errorHandler'); // A centralized error handler utility
const {handleError} = require('../utils/errorHandler');
const { validateUserInput } = require('../utils/validators'); // Input validation utility

const secretKey = config.jwtSecret;

// Register User (Create)
/* exports.register = async (req, res) => {
  try {
    const { username, password, userrole, deptId } = req.body;

    // Input validation
    const validationError = validateUserInput({ username, password, userrole });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Create user
    const user = new User({ username, password, userrole, deptId });
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { _id: user._id.toString(), deptId: user.deptId },
      secretKey,
      { expiresIn: '1d' }
    );

    res.status(201).send({ user, token });
    logger.info('User registered successfully', { userId: user._id });
  } catch (error) {
    handleError(res, error, 'User registration failed');
  }
};
 */
exports.register = async (req, res) => {
  try {
    const { username, password, userrole, deptId } = req.body;

    // Input validation
    const validationError = validateUserInput({ username, password, userrole });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' }); // 409 Conflict
    }

    // Create user
    const user = new User({ username, password, userrole, deptId });
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { _id: user._id.toString(), deptId: user.deptId },
      secretKey,
      { expiresIn: '1d' }
    );

    // Restrict sensitive fields in response
    res.status(201).send({
      user: { username: user.username, userrole: user.userrole, deptId: user.deptId },
      token,
    });

    logger.info('User registered successfully', { userId: user._id });
  } catch (error) {
    handleError(res, error, 'User registration failed');
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user and validate password
    const user = await User.findOne({ username }).populate('deptId');
    if (!user || !(await user.comparePassword(password))) {
      logger.warn('Login failed', { username });
      return res.status(401).json({ message: 'Incorrect username or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { _id: user._id, username: user.username, deptId: user.deptId, userrole: user.userrole},
      secretKey,
      { expiresIn: '1d' }
    );

    res.send({ _id: user._id, username: user.username, userrole: user.userrole, deptId: user.deptId, token });
    logger.info('User logged in successfully', { userId: user._id });
  } catch (error) {
    handleError(res, error, 'Login failed');
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'username';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

    const searchRegex = new RegExp(search, 'i');

    const totalUsers = await User.countDocuments({ username: searchRegex });
    const users = await User.find({ username: searchRegex }, '-password')
      .populate('deptId', 'deptName deptCode')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      users,
      metadata: {
        totalUsers,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalUsers / limit),
      },
    });
    logger.info('Users fetched successfully', { query: req.query });
  } catch (error) {
    handleError(res, error, 'Error fetching users');
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
    handleError(res, error, 'Error fetching user by ID');
  }
};

// Update User by ID
exports.updateUser = async (req, res) => {
  try {
    const { username, password, userrole, deptId } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields conditionally
    user.username = username || user.username;
    if (password) user.password = password; // Triggers password hashing
    user.userrole = userrole || user.userrole;
    user.deptId = deptId || user.deptId;

    await user.save();
    res.status(200).json(user);
    logger.info('User updated successfully', { userId: user._id });
  } catch (error) {
    handleError(res, error, 'Error updating user');
  }
};

// Delete User by ID
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(204).send(); // 204 No Content
    logger.info('User deleted successfully', { userId: user._id });
  } catch (error) {
    handleError(res, error, 'Error deleting user');
  }
};
