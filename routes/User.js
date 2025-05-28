const express = require('express');
const { check, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const userController = require('../controllers/User');
const authenticateJWT = require('../middlewares/authMiddleware');

// Rate limiter for login route
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 60 requests per windowMs
  message: { message: 'Too many login attempts from this IP, please try again later.' }, // Return message as JSON
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
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
    '/registerdev',
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

// Register route with authentication
router.post(
  '/register',
  authenticateJWT,
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

// Get all users (protected route)
router.get('/', authenticateJWT, async (req, res, next) => {
  try {
    await userController.getAllUsers(req, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a user by ID (protected route)
router.get('/:id', authenticateJWT, async (req, res, next) => {
  try {
    await userController.getUserById(req, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a user by ID (protected route)
router.put(
  '/:id',
  authenticateJWT,
  [
    check('username', 'Username is required').optional().notEmpty(),
    check('password', 'Password must be at least 6 characters long').optional().isLength({ min: 6 }),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      await userController.updateUser(req, res);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete a user by ID (protected route)
router.delete('/:id', authenticateJWT, async (req, res, next) => {
  try {
    await userController.deleteUser(req, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
