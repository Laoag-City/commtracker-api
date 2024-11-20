const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');
const logger = require('../utils/logger');

const auth = async (req, res, next) => {
  try {
    // Check if the Authorization header exists
    const authorizationHeader = req.header('Authorization');
    if (!authorizationHeader) {
      throw new Error('Authorization header missing');
    }

    // Remove 'Bearer ' from the token string
    const token = authorizationHeader.replace('Bearer ', '');
    if (!token) {
      throw new Error('Token missing or malformed');
    }

    // Verify and decode the JWT token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Find the user by decoded ID from the JWT payload
    const user = await User.findOne({ _id: decoded._id });

    if (!user) {
      throw new Error('User not found');
    }

    // Attach token and user to the request object for further middleware/controllers
    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    // Handle expired token error specifically
    if (error.name === 'TokenExpiredError') {
      logger.error('Token expired:', { message: error.message });
      return res.status(401).send({ error: 'Token expired. Please log in again.' });
    }

    // Log other errors (invalid token, missing user, etc.)
    logger.error('Authentication error:', { message: error.message, stack: error.stack });
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

module.exports = auth;
/* with RBAC
const auth = (requiredRole) => {
  return async (req, res, next) => {
    try {
      const authorizationHeader = req.header('Authorization');
      if (!authorizationHeader) {
        throw new Error('Authorization header missing');
      }

      const token = authorizationHeader.replace('Bearer ', '');
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findOne({ _id: decoded._id });

      if (!user) {
        throw new Error('User not found');
      }

      // Check if the user's role matches the required role
      if (requiredRole && user.userrole !== requiredRole) {
        return res.status(403).send({ error: 'Access forbidden: insufficient permissions.' });
      }

      req.token = token;
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        logger.error('Token expired:', { message: error.message });
        return res.status(401).send({ error: 'Token expired. Please log in again.' });
      }

      logger.error('Authentication error:', { message: error.message, stack: error.stack });
      res.status(401).send({ error: 'Please authenticate.' });
    }
  };
};

module.exports = auth;
usage in route:
const auth = require('./middleware/authMiddleware');
app.post('/admin', auth('admin'), adminController.adminFunction);

*/