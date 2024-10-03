// __tests__/userController.test.js
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const config = require('../config');
const logger = require('../utils/logger');
const userController = require('../controllers/userController');

const app = express();
app.use(express.json());

// Mock Routes
app.post('/register', userController.register);
app.post('/login', userController.login);
app.get('/users', userController.getAllUsers);
app.get('/users/:id', userController.getUserById);
app.put('/users/:id', userController.updateUser);
app.delete('/users/:id', userController.deleteUser);

// Mocking external dependencies
jest.mock('../models/userModel');
jest.mock('jsonwebtoken');
jest.mock('../utils/logger');

// Mock configuration
const secretKey = config.jwtSecret;

describe('User Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /register', () => {
    it('should register a user and return a JWT token', async () => {
      const mockUser = {
        _id: '123',
        username: 'testuser',
        password: 'hashedpassword',
        deptId: 'dept123',
        save: jest.fn(),
      };
      User.mockImplementation(() => mockUser);

      jwt.sign.mockReturnValue('fakeToken');

      const response = await request(app)
        .post('/register')
        .send({ username: 'testuser', password: 'password', userrole: 'admin', deptId: 'dept123' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token', 'fakeToken');
      expect(mockUser.save).toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalledWith(
        { _id: mockUser._id.toString(), deptId: mockUser.deptId },
        secretKey,
        { expiresIn: '1d' }
      );
    });

    it('should return 400 if user registration fails', async () => {
      User.mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await request(app)
        .post('/register')
        .send({ username: 'testuser', password: 'password', userrole: 'admin', deptId: 'dept123' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Database error');
      expect(logger.error).toHaveBeenCalledWith('User registration failed', { error: 'Database error' });
    });
  });

  describe('POST /login', () => {
    it('should log in the user and return a JWT token', async () => {
      const mockUser = {
        _id: '123',
        username: 'testuser',
        password: 'hashedpassword',
        deptId: 'dept123',
        comparePassword: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis(),
      };

      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('fakeToken');

      const response = await request(app)
        .post('/login')
        .send({ username: 'testuser', password: 'password' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token', 'fakeToken');
      expect(User.findOne).toHaveBeenCalledWith({ username: 'testuser' });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password');
    });

    it('should return 401 for incorrect username or password', async () => {
      User.findOne.mockResolvedValue(null);  // Simulate incorrect credentials
    
      const response = await request(app)
        .post('/login')
        .send({ username: 'testuser', password: 'wrongpassword' });
    
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Incorrect username or password');
      expect(logger.warn).toHaveBeenCalledWith('Login failed due to incorrect username or password', { username: 'testuser' });
    });
  });

  describe('GET /users', () => {
    it('should return all users', async () => {
      const mockUsers = [{ _id: '123', username: 'user1', deptId: 'dept123' }];
      User.find.mockResolvedValue(mockUsers);

      const response = await request(app).get('/users');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUsers);
      expect(User.find).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Users fetched successfully');
    });

    it('should return 500 if fetching users fails', async () => {
      User.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await request(app).get('/users');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error fetching users');
      expect(logger.error).toHaveBeenCalledWith('Error fetching users', { error: 'Database error' });
    });
  });

  describe('GET /users/:id', () => {
    it('should return user by ID', async () => {
      const mockUser = { _id: '123', username: 'testuser', deptId: 'dept123' };
      User.findById.mockResolvedValue(mockUser);

      const response = await request(app).get('/users/123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
      expect(User.findById).toHaveBeenCalledWith('123');
      expect(logger.info).toHaveBeenCalledWith('User fetched successfully', { userId: '123' });
    });

    it('should return 404 if user not found', async () => {
      User.findById.mockResolvedValue(null);

      const response = await request(app).get('/users/123');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });
  });

  describe('PUT /users/:id', () => {
    it('should update the user and return the updated data', async () => {
      const mockUser = { _id: '123', username: 'testuser', deptId: 'dept123', save: jest.fn() };
      User.findById.mockResolvedValue(mockUser);

      const response = await request(app)
        .put('/users/123')
        .send({ username: 'updateduser', userrole: 'admin' });

      expect(response.status).toBe(200);
      expect(mockUser.save).toHaveBeenCalled();
      expect(User.findById).toHaveBeenCalledWith('123');
      expect(logger.info).toHaveBeenCalledWith('User updated successfully', { userId: '123' });
    });

    it('should return 404 if user not found', async () => {
      User.findById.mockResolvedValue(null);

      const response = await request(app).put('/users/123');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete the user by ID', async () => {
      const mockUser = { _id: '123' };
      User.findByIdAndDelete.mockResolvedValue(mockUser);

      const response = await request(app).delete('/users/123');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'User deleted successfully');
      expect(User.findByIdAndDelete).toHaveBeenCalledWith('123');
      expect(logger.info).toHaveBeenCalledWith('User deleted successfully', { userId: '123' });
    });

    it('should return 404 if user not found', async () => {
      User.findByIdAndDelete.mockResolvedValue(null);

      const response = await request(app).delete('/users/123');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });
  });
});
