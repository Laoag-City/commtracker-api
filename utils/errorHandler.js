const logger = require('./logger'); // Assume logger utility is already implemented

/**
 * Centralized error handler utility
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 * @param {String} message - Custom error message
 */
exports.handleError = (res, error, message) => {
  logger.error(message, { error: error.message });
  
  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({ message, details: error.errors });
  } else if (error.name === 'CastError' && error.kind === 'ObjectId') {
    return res.status(404).json({ message: 'Invalid ID format' });
  }

  // Default to internal server error
  res.status(500).json({ message, error: error.message });
};
