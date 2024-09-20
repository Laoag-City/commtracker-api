const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

const secretKey = config.jwtSecret;

// Register User
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
      { expiresIn: '1d' }  // Optional: set token expiration to 1 day for better security
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
    const user = await User.findOne({ username }).populate('deptId'); // Populate deptId if needed
    if (!user || !(await user.comparePassword(password))) {
      logger.warn('Login failed due to incorrect username or password', { username });
      return res.status(401).json({ message: 'Incorrect username or password' });
    }

    // Generate JWT with deptId included
    const token = jwt.sign(
      { _id: user._id, username: user.username, deptId: user.deptId },
      secretKey,
      { expiresIn: '1d' }  // Optional: set token expiration to 1 day for better security
    );

    // Send user details and token
    res.send({ _id: user._id, username: user.username, userrole: user.userrole, deptId: user.deptId, token });
    logger.info('User logged in successfully', { userId: user._id });
  } catch (error) {
    logger.error('Login failed', { error: error.message });
    res.status(400).send({ error: error.message });
  }
};
