const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

const secretKey = config.jwtSecret;

exports.register = async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    const token = jwt.sign({ _id: user._id.toString() }, secretKey);
    res.status(201).send({ user, token });
    logger.info('User registered successfully', { userId: user._id });
  } catch (error) {
    logger.error('User registration failed', { error: error.message });
    res.status(400).send(error);
  }
};

exports.login = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (!user || !(await user.comparePassword(req.body.password))) {
      logger.warn('Login failed due to incorrect username or password', { username: req.body.username });
      return res.status(401).json({ message: 'Incorrect username or password' });
    }
    const token = jwt.sign({ _id: user._id, username: user.username }, secretKey, { expiresIn: '1d' });
    res.send({ _id: user._id, username: user.username, userrole: user.userrole, token });
    logger.info('User logged in successfully', { userId: user._id });
  } catch (error) {
    logger.error('Login failed', { error: error.message });
    res.status(400).send(error);
  }
};
