const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Group = require('../models/groupModel');  // Path to your groupModel.js

describe('Group Model Tests', () => {
  let mongoServer;

  // Set up an in-memory MongoDB server before running the tests
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  // Clean up after each test
  afterEach(async () => {
    await Group.deleteMany({});
  });

  // Disconnect and stop MongoDB server after all tests are done
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // Test creating a valid group
  it('should create a group with valid data', async () => {
    const validGroup = {
      groupName: 'Engineering Team',
      departmentIds: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()]
    };

    const group = new Group(validGroup);
    const savedGroup = await group.save();

    expect(savedGroup._id).toBeDefined();
    expect(savedGroup.groupName).toBe(validGroup.groupName);
    expect(savedGroup.departmentIds).toHaveLength(2);
  });

  // Test missing groupName
  it('should throw validation error if groupName is missing', async () => {
    const invalidGroup = {
      departmentIds: [new mongoose.Types.ObjectId()]
    };

    try {
      const group = new Group(invalidGroup);
      await group.save();
    } catch (error) {
      expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(error.errors.groupName).toBeDefined();
      expect(error.errors.groupName.message).toBe('Path `groupName` is required.');
    }
  });

  // Test missing departmentIds
  it('should throw validation error if departmentIds is missing', async () => {
    const invalidGroup = {
      groupName: 'Marketing Team'
    };

    try {
      const group = new Group(invalidGroup);
      await group.save();
    } catch (error) {
      expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(error.errors.departmentIds).toBeDefined();
      expect(error.errors.departmentIds.message).toBe('Path `departmentIds` is required.');
    }
  });

  // Test invalid ObjectId in departmentIds
  it('should throw a validation error if departmentIds contains invalid ObjectIds', async () => {
    const invalidGroup = {
      groupName: 'HR Team',
      departmentIds: ['invalidObjectId']
    };

    try {
      const group = new Group(invalidGroup);
      await group.save();
    } catch (error) {
      expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(error.errors['departmentIds.0'].message).toContain('Cast to [ObjectId] failed');
    }
  });

  // Test timestamps
  it('should automatically set createdAt and updatedAt fields', async () => {
    const validGroup = {
      groupName: 'Operations Team',
      departmentIds: [new mongoose.Types.ObjectId()]
    };

    const group = new Group(validGroup);
    const savedGroup = await group.save();

    expect(savedGroup.createdAt).toBeDefined();
    expect(savedGroup.updatedAt).toBeDefined();
    expect(savedGroup.createdAt).toBeInstanceOf(Date);
    expect(savedGroup.updatedAt).toBeInstanceOf(Date);
  });

  // Test updating a group and checking updatedAt
  it('should update updatedAt field when group is updated', async () => {
    const validGroup = {
      groupName: 'Support Team',
      departmentIds: [new mongoose.Types.ObjectId()]
    };

    const group = new Group(validGroup);
    const savedGroup = await group.save();

    const oldUpdatedAt = savedGroup.updatedAt;

    // Wait a bit before updating the group to test updatedAt change
    await new Promise((resolve) => setTimeout(resolve, 1000));

    savedGroup.groupName = 'Customer Support Team';
    const updatedGroup = await savedGroup.save();

    expect(updatedGroup.updatedAt).not.toBe(oldUpdatedAt);
  });
});
