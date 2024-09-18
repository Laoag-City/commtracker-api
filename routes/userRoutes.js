const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
//const authMiddleware = require('../middlewares/auth'); // Commented out, optional

// Register route available only in non-production environments
if (process.env.NODE_ENV !== 'production') {
  router.post('/register', async (req, res, next) => {
    try {
      await userController.register(req, res);
    } catch (error) {
      //next(error); // Forward to error handler
      res.status(500).json({ error: error.message });  // Return the error message in JSON format
    }
  });
}

// Login route
router.post('/login', async (req, res, next) => {
  try {
    await userController.login(req, res);
  } catch (error) {
    //next(error); // Forward to error handler
    res.status(500).json({ error: error.message });  // Return the error message in JSON format
  }
});

module.exports = router;
