const request = require('supertest');
const express = require('express');
const userRoutes = require('../routes/userRoutes');
const app = express();
app.use(express.json());
app.use('/users', userRoutes);

// Mock userController functions
jest.mock('../controllers/userController', () => ({
  register: jest.fn((req, res) => res.status(201).json({ message: 'User registered successfully' })),
  login: jest.fn((req, res) => res.status(200).json({ message: 'User logged in successfully' })),
}));

describe('User Routes', () => {
  describe('POST /users/register', () => {
    if (process.env.NODE_ENV !== 'production') {
      it('should register a new user', async () => {
        const response = await request(app)
          .post('/users/register')
          .send({ username: 'testuser', password: 'testpass' });
        
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('message', 'User registered successfully');
      });

      it('should handle error during registration', async () => {
        const userController = require('../controllers/userController');
        userController.register.mockImplementationOnce(() => {
          throw new Error('Registration failed');
        });

        const response = await request(app)
          .post('/users/register')
          .send({ username: 'testuser', password: 'testpass' });

        expect(response.statusCode).toBe(500);
        expect(response.body).toHaveProperty('error', 'Registration failed');
      });

      it('should return 400 if username is missing', async () => {
        const response = await request(app)
          .post('/users/register')
          .send({ password: 'testpass' }); // Missing username

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('error', 'Username is required');
      });

      it('should return 400 if password is missing', async () => {
        const response = await request(app)
          .post('/users/register')
          .send({ username: 'testuser' }); // Missing password

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('error', 'Password is required');
      });
    }
  });

  describe('POST /users/login', () => {
    it('should log in a user', async () => {
      const response = await request(app)
        .post('/users/login')
        .send({ username: 'testuser', password: 'testpass' });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message', 'User logged in successfully');
    });

    it('should handle error during login', async () => {
      const userController = require('../controllers/userController');
      userController.login.mockImplementationOnce(() => {
        throw new Error('Login failed');
      });

      const response = await request(app)
        .post('/users/login')
        .send({ username: 'testuser', password: 'testpass' });

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('error', 'Login failed');
    });

    it('should return 400 if username is missing during login', async () => {
      const response = await request(app)
        .post('/users/login')
        .send({ password: 'testpass' }); // Missing username

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error', 'Username is required');
    });

    it('should return 400 if password is missing during login', async () => {
      const response = await request(app)
        .post('/users/login')
        .send({ username: 'testuser' }); // Missing password

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error', 'Password is required');
    });
  });
});
