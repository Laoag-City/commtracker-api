const { body, param, validationResult } = require('express-validator');

// Validation rules for tracker creation
const validateCreateTracker = [
  body('fromName').notEmpty().withMessage('From Name is required'),
  body('documentTitle').notEmpty().withMessage('Document Title is required'),
  body('dateReceived').notEmpty().isISO8601().withMessage('dateReceived must be a valid date'),
  body('recipient').isArray().withMessage('Recipient must be an array'),
  body('recipient.*.receivingDepartment').notEmpty().withMessage('Receiving Department is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

// Validation rules for tracker ID
const validateTrackerId = [
  param('id').isMongoId().withMessage('Invalid tracker ID'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = {
  validateCreateTracker,
  validateTrackerId,
};
