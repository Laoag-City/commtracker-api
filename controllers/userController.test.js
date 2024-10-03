const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const userController = require('../controllers/userController');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

// Mock external dependencies
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');
jest.mock('../models/userModel');
jest.mock('../utils/logger');

// Create an express app and use json middleware
const app = express();
app.use(express.json());

// Define routes for the controller methods
app.post('/users/register', userController.register);
app.post('/users/login', userController.login);
app.get('/users', userController.getAllUsers);
app.get('/users/:id', userController.getUserById);
app.put('/users/:id', userController.updateUser);
app.delete('/users/:id', userController.deleteUser);

describe('User Controller Tests', () => {
  // Test user registration
  describe('POST /users/register', () => {
    it('should register a user and return a token', async () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        username: 'testuser',
        password: 'hashedPassword',
        userrole: 'admin',
        deptId: new mongoose.Types.ObjectId()
      };

      User.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(mockUser)
      }));
      jwt.sign.mockReturnValue('mockToken');

      const res = await request(app)
        .post('/users/register')
        .send({ username: 'usertest', password: 'password', userrole: 'admin', deptId: mockUser.deptId });

      expect(res.status).toBe(201);
      expect(res.body.token).toBe('mockToken');
      expect(logger.info).toHaveBeenCalledWith('User registered successfully', { userId: mockUser._id });
    });

    it('should return an error if registration fails', async () => {
      User.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('Registration failed'))
      }));

      const res = await request(app)
        .post('/users/register')
        .send({ username: 'testuser', password: 'password', userrole: 'admin', deptId: 'deptId' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Registration failed');
      expect(logger.error).toHaveBeenCalledWith('User registration failed', { error: 'Registration failed' });
    });
  });

  // Test user login
  describe('POST /users/login', () => {
    it('should login a user and return a token', async () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        username: 'testuser',
        password: 'hashedPassword',
        userrole: 'admin',
        deptId: new mongoose.Types.ObjectId(),
        comparePassword: jest.fn().mockResolvedValue(true)
      };

      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('mockToken');
      bcrypt.compare.mockResolvedValue(true);

      const res = await request(app)
        .post('/users/login')
        .send({ username: 'testuser', password: 'password' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBe('mockToken');
      expect(logger.info).toHaveBeenCalledWith('User logged in successfully', { userId: mockUser._id });
    });

    it('should return an error if login fails', async () => {
      User.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/users/login')
        .send({ username: 'testuser', password: 'password' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Incorrect username or password');
      expect(logger.warn).toHaveBeenCalledWith('Login failed due to incorrect username or password', { username: 'testuser' });
    });
  });

  // Test fetching all users
  describe('GET /users', () => {
    it('should return all users', async () => {
      const mockUsers = [
        { _id: 'user1', username: 'user1', userrole: 'admin', deptId: 'dept1' },
        { _id: 'user2', username: 'user2', userrole: 'user', deptId: 'dept2' }
      ];

      User.find.mockResolvedValue(mockUsers);

      const res = await request(app).get('/users');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockUsers);
      expect(logger.info).toHaveBeenCalledWith('Users fetched successfully');
    });

    it('should return error if fetching users fails', async () => {
      User.find.mockRejectedValue(new Error('Fetch failed'));

      const res = await request(app).get('/users');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error fetching users');
      expect(logger.error).toHaveBeenCalledWith('Error fetching users', { error: 'Fetch failed' });
    });
  });

  // Test fetching a single user
  describe('GET /users/:id', () => {
    it('should return a single user by id', async () => {
      const mockUser = { _id: 'user1', username: 'user1', userrole: 'admin', deptId: 'dept1' };

      User.findById.mockResolvedValue(mockUser);

      const res = await request(app).get('/users/user1');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockUser);
      expect(logger.info).toHaveBeenCalledWith('User fetched successfully', { userId: 'user1' });
    });

    it('should return 404 if user is not found', async () => {
      User.findById.mockResolvedValue(null);

      const res = await request(app).get('/users/user1');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });
  });

  // Test user update
  describe('PUT /users/:id', () => {
    it('should update a user by id', async () => {
      const mockUser = {
        _id: 'user1',
        username: 'user1',
        password: 'hashedPassword',
        userrole: 'admin',
        deptId: 'dept1',
        save: jest.fn().mockResolvedValue()
      };

      User.findById.mockResolvedValue(mockUser);

      const res = await request(app)
        .put('/users/user1')
        .send({ username: 'newUser', password: 'newPassword', userrole: 'user', deptId: 'dept1' });

      expect(res.status).toBe(200);
      expect(mockUser.username).toBe('newUser');
      expect(mockUser.password).toBe('newPassword'); // Password hashing tested separately
      expect(logger.info).toHaveBeenCalledWith('User updated successfully', { userId: mockUser._id });
    });

    it('should return 404 if user is not found', async () => {
      User.findById.mockResolvedValue(null);

      const res = await request(app).put('/users/user1').send({ username: 'newUser' });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });
  });

  // Test user deletion
  describe('DELETE /users/:id', () => {
    it('should delete a user by id', async () => {
      const mockUser = { _id: 'user1' };

      User.findByIdAndDelete.mockResolvedValue(mockUser);

      const res = await request(app).delete('/users/user1');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('User deleted successfully');
      expect(logger.info).toHaveBeenCalledWith('User deleted successfully', { userId: mockUser._id });
    });

    it('should return 404 if user is not found', async () => {
      User.findByIdAndDelete.mockResolvedValue(null);

      const res = await request(app).delete('/users/user1');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });
  });
});
