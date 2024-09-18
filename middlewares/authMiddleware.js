// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const config = require('../config');
const logger = require('../utils/logger');

const auth = async (req, res, next) => {
  try {
    const authorizationHeader = req.header('Authorization');
    if (!authorizationHeader) {
      throw new Error('Authorization header missing');
    }

    const token = authorizationHeader.replace('Bearer ', '');
    if (!token) {
      throw new Error('Token missing or malformed');
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findOne({ _id: decoded._id });

    if (!user) {
      throw new Error('User not found');
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', { message: error.message, stack: error.stack });
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

module.exports = auth;
