const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const userController = require('../controllers/userController');

// Helper function to handle validation errors
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

// Register route available only in non-production environments
if (process.env.NODE_ENV !== 'production') {
  router.post(
    '/register',
    [
      check('username', 'Username is required').notEmpty(),
      check('password', 'Password is required').notEmpty(),
    ],
    validateRequest,
    async (req, res, next) => {
      try {
        await userController.register(req, res);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  );
}

// Login route
router.post(
  '/login',
  [
    check('username', 'Username is required').notEmpty(),
    check('password', 'Password is required').notEmpty(),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      await userController.login(req, res);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
