const request = require('supertest');
const bcrypt = require('bcrypt');
const express = require('express');
const userRoutes = require('../routes/userRoutes');
const app = express();
app.use(express.json());
app.use('/users', userRoutes);

// Mock userController functions
jest.mock('../controllers/userController', () => ({
  register: jest.fn(async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    res.status(201).json({ message: 'User registered successfully', password: hashedPassword });
  }),
  login: jest.fn(async (req, res) => {
    const { username, password } = req.body;
    const storedPasswordHash = await bcrypt.hash('correctpassword', 10);
    const isPasswordValid = await bcrypt.compare(password, storedPasswordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    res.status(200).json({ message: 'User logged in successfully' });
  }),
}));

describe('User Routes', () => {
  describe('POST /users/register', () => {
    it('should register a new user with a hashed password', async () => {
      const response = await request(app)
        .post('/users/register')
        .send({ username: 'testuser', password: 'testpass' });

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('password');
      expect(await bcrypt.compare('testpass', response.body.password)).toBe(true);
    });
  });

  describe('POST /users/login', () => {
    it('should return 401 for incorrect password', async () => {
      const response = await request(app)
        .post('/users/login')
        .send({ username: 'testuser', password: 'wrongpass' });

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid username or password');
    });

    it('should limit the number of login attempts', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/users/login')
          .send({ username: 'testuser', password: 'wrongpass' });
      }

      const response = await request(app)
        .post('/users/login')
        .send({ username: 'testuser', password: 'wrongpass' });

      expect(response.statusCode).toBe(429);
      expect(response.body).toHaveProperty('message', 'Too many login attempts from this IP, please try again later.');
    });
  });
});
