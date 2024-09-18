const express = require('express');
const { check, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const userController = require('../controllers/userController');

// Rate limiter for login route
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many login attempts from this IP, please try again later.',
});

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
      check('password', 'Password must be at least 6 characters long').isLength({ min: 6 }),
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

// Login route with rate limiter
router.post(
  '/login',
  loginLimiter,
  [
    check('username', 'Username is required').notEmpty(),
    check('password', 'Password must be at least 6 characters long').isLength({ min: 6 }),
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
