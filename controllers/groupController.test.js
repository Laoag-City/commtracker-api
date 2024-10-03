const request = require('supertest');
const express = require('express');
const Group = require('../models/groupModel');
const Department = require('../models/departmentModel');
const groupController = require('../controllers/groupController');
const logger = require('../utils/logger');

// Mock external dependencies
jest.mock('../models/groupModel');
jest.mock('../models/departmentModel');
jest.mock('../utils/logger');

// Create an express app and use json middleware
const app = express();
app.use(express.json());

// Define routes for the controller methods
app.post('/groups', groupController.createGroup);
app.get('/groups', groupController.getAllGroups);
app.get('/groups/:id', groupController.getGroupById);
app.put('/groups/:id', groupController.updateGroup);
app.delete('/groups/:id', groupController.deleteGroup);

describe('Group Controller Tests', () => {
  // Test group creation
  describe('POST /groups', () => {
    it('should create a group if departments exist', async () => {
      const mockDepartments = [{ _id: '66fca3c561196993d2443c44' }, { _id: '66fca3f561196993d2443c48' }];
      Department.find.mockResolvedValue(mockDepartments);
      const mockGroup = { _id: 'group1', groupName: 'Test Group', departmentIds: ['66fca3c561196993d2443c44', '66fca3f561196993d2443c48'] };
      Group.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(mockGroup)
      }));

      const res = await request(app)
        .post('/groups')
        .send(mockGroup);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(mockGroup);
    });

    it('should return an error if one or more departments are not found', async () => {
      const mockDepartments = [{ _id: '66fca3c561196993d2443c44' }]; // Missing dept2
      Department.find.mockResolvedValue(mockDepartments);

      const res = await request(app)
        .post('/groups')
        .send({ groupName: 'Test Group', departmentIds: ['66fca3c561196993d2443c4', '66fca3f561196993d2443c'] });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('One or more departments not found');
    });

    it('should return an error if there is a server error', async () => {
      Department.find.mockRejectedValue(new Error('Database error'));

      const res = await request(app)
        .post('/groups')
        .send({ groupName: 'Test Group', departmentIds: ['dept1', 'dept2'] });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error creating group');
    });
  });

  // Test fetching all groups
  describe('GET /groups', () => {
    it('should return all groups', async () => {
      const mockGroups = [
        { _id: 'group1', groupName: 'Group 1', departmentIds: ['dept1'] },
        { _id: 'group2', groupName: 'Group 2', departmentIds: ['dept2'] }
      ];
      Group.find.mockResolvedValue(mockGroups);

      const res = await request(app).get('/groups');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockGroups);
      expect(logger.info).toHaveBeenCalledWith('Groups fetched successfully');
    });

    it('should return an error if fetching groups fails', async () => {
      Group.find.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/groups');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error fetching groups');
      expect(logger.error).toHaveBeenCalledWith('Error fetching groups', { error: 'Database error' });
    });
  });

  // Test fetching a single group
  describe('GET /groups/:id', () => {
    it('should return a group by id', async () => {
      const mockGroup = { _id: 'group1', groupName: 'Group 1', departmentIds: ['dept1'] };
      Group.findById.mockResolvedValue(mockGroup);

      const res = await request(app).get('/groups/group1');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockGroup);
    });

    it('should return 404 if group is not found', async () => {
      Group.findById.mockResolvedValue(null);

      const res = await request(app).get('/groups/group1');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Group not found');
    });

    it('should return an error if fetching group fails', async () => {
      Group.findById.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/groups/group1');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error fetching group');
    });
  });

  // Test updating a group
  describe('PUT /groups/:id', () => {
    it('should update a group if departments exist', async () => {
      const mockDepartments = [{ _id: 'dept1' }, { _id: 'dept2' }];
      Department.find.mockResolvedValue(mockDepartments);
      const mockGroup = { _id: 'group1', groupName: 'Updated Group', departmentIds: ['dept1', 'dept2'] };
      Group.findByIdAndUpdate.mockResolvedValue(mockGroup);

      const res = await request(app)
        .put('/groups/group1')
        .send({ groupName: 'Updated Group', departmentIds: ['dept1', 'dept2'] });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockGroup);
    });

    it('should return an error if one or more departments are not found', async () => {
      const mockDepartments = [{ _id: 'dept1' }];
      Department.find.mockResolvedValue(mockDepartments);

      const res = await request(app)
        .put('/groups/group1')
        .send({ groupName: 'Updated Group', departmentIds: ['dept1', 'dept2'] });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('One or more departments not found');
    });

    it('should return 404 if group is not found', async () => {
      Group.findByIdAndUpdate.mockResolvedValue(null);

      const res = await request(app)
        .put('/groups/group1')
        .send({ groupName: 'Updated Group', departmentIds: ['dept1', 'dept2'] });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('One or more departments not found');
    });

    it('should return an error if updating group fails', async () => {
      Department.find.mockRejectedValue(new Error('Database error'));

      const res = await request(app)
        .put('/groups/group1')
        .send({ groupName: 'Updated Group', departmentIds: ['dept1', 'dept2'] });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error updating group');
    });
  });

  // Test deleting a group
  describe('DELETE /groups/:id', () => {
    it('should delete a group by id', async () => {
      const mockGroup = { _id: 'group1', groupName: 'Group 1' };
      Group.findByIdAndDelete.mockResolvedValue(mockGroup);

      const res = await request(app).delete('/groups/group1');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Group deleted');
    });

    it('should return 404 if group is not found', async () => {
      Group.findByIdAndDelete.mockResolvedValue(null);

      const res = await request(app).delete('/groups/group1');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Group not found');
    });

    it('should return an error if deleting group fails', async () => {
      Group.findByIdAndDelete.mockRejectedValue(new Error('Database error'));

      const res = await request(app).delete('/groups/group1');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error deleting group');
    });
  });
});
