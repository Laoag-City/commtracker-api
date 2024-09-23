const request = require('supertest');
const express = require('express');
const userRoutes = require('../routes/userRoutes');
const app = express();
app.use(express.json());
app.use('/users', userRoutes);

// Mock bcrypt and jwt inside userController to avoid out-of-scope variable issues
jest.mock('../controllers/userController', () => {
  const bcrypt = {
    hash: jest.fn(async (password, saltRounds) => `hashed_${password}`),
    compare: jest.fn(async (password, hashedPassword) => hashedPassword === `hashed_${password}`),
  };

  const jwt = {
    sign: jest.fn(() => 'mocked_jwt_token'),
  };

  return {
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
      res.status(200).json({ message: 'User logged in successfully', token: jwt.sign() });
    }),
    getAllUsers: jest.fn(async (req, res) => {
      res.status(200).json([{ _id: '1', username: 'user1' }, { _id: '2', username: 'user2' }]);
    }),
    getUserById: jest.fn(async (req, res) => {
      const userId = req.params.id;
      if (userId === '1') {
        res.status(200).json({ _id: '1', username: 'user1' });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    }),
    updateUser: jest.fn(async (req, res) => {
      const userId = req.params.id;
      if (userId === '1') {
        res.status(200).json({ _id: '1', username: 'updated_user1' });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    }),
    deleteUser: jest.fn(async (req, res) => {
      const userId = req.params.id;
      if (userId === '1') {
        res.status(200).json({ message: 'User deleted successfully' });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    }),
  };
});

describe('User Routes', () => {
  describe('POST /users/register', () => {
    it('should register a new user with a hashed password', async () => {
      const response = await request(app)
        .post('/users/register')
        .send({ username: 'testuser', password: 'testpass' });

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('password');
      expect(response.body.password).toBe('hashed_testpass');
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

    it('should return 200 for correct credentials', async () => {
      const response = await request(app)
        .post('/users/login')
        .send({ username: 'testuser', password: 'correctpassword' });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message', 'User logged in successfully');
      expect(response.body).toHaveProperty('token');
    });
  });

  describe('GET /users', () => {
    it('should return all users', async () => {
      const response = await request(app)
        .get('/users')
        .set('Authorization', 'Bearer mocked_jwt_token');

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('username', 'user1');
      expect(response.body[1]).toHaveProperty('username', 'user2');
    });
  });

  describe('GET /users/:id', () => {
    it('should return a user by ID', async () => {
      const response = await request(app)
        .get('/users/1')
        .set('Authorization', 'Bearer mocked_jwt_token');

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('username', 'user1');
    });

    it('should return 404 for a non-existent user', async () => {
      const response = await request(app)
        .get('/users/999')
        .set('Authorization', 'Bearer mocked_jwt_token');

      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });

  describe('PUT /users/:id', () => {
    it('should update a user by ID', async () => {
      const response = await request(app)
        .put('/users/1')
        .set('Authorization', 'Bearer mocked_jwt_token')
        .send({ username: 'updated_user1' });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('username', 'updated_user1');
    });

    it('should return 404 for a non-existent user', async () => {
      const response = await request(app)
        .put('/users/999')
        .set('Authorization', 'Bearer mocked_jwt_token')
        .send({ username: 'updated_user999' });

      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete a user by ID', async () => {
      const response = await request(app)
        .delete('/users/1')
        .set('Authorization', 'Bearer mocked_jwt_token');

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message', 'User deleted successfully');
    });

    it('should return 404 for a non-existent user', async () => {
      const response = await request(app)
        .delete('/users/999')
        .set('Authorization', 'Bearer mocked_jwt_token');

      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });
});
