const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('./userModel');  // Path to your userModel.js

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'), // Mock bcryptjs.hash
  compare: jest.fn().mockResolvedValue(true),          // Mock bcryptjs.compare
}));

describe('User Model Tests', () => {
  let mongoServer;

  // Setup in-memory MongoDB server before running the tests
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  // Clean up after each test
  afterEach(async () => {
    await User.deleteMany({});
  });

  // Disconnect and stop MongoDB server after all tests are done
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('should hash password before saving', async () => {
    const user = new User({
      username: 'testuser',
      password: 'plainPassword',
      userrole: 'admin',
      deptId: new mongoose.Types.ObjectId(),
    });

    await user.save();

    // Ensure bcryptjs.hash was called to hash the password
    expect(bcrypt.hash).toHaveBeenCalledWith('plainPassword', 10);
    // Check that the password was actually hashed
    expect(user.password).toBe('hashedPassword');
  });

  it('should compare hashed passwords correctly', async () => {
    const user = new User({
      username: 'testuser',
      password: 'plainPassword',  // This will be hashed due to pre-save hook
      userrole: 'admin',
      deptId: new mongoose.Types.ObjectId(),
    });

    await user.save();

    const isMatch = await user.comparePassword('plainPassword');
    expect(bcrypt.compare).toHaveBeenCalledWith('plainPassword', 'hashedPassword');
    expect(isMatch).toBe(true);  // Mocked to always return true
  });

  it('should return an error if the username already exists', async () => {
    const user1 = new User({
      username: 'testuser',
      password: 'password1',
      userrole: 'admin',
      deptId: new mongoose.Types.ObjectId(),
    });

    const user2 = new User({
      username: 'testuser', // Duplicate username
      password: 'password2',
      userrole: 'admin',
      deptId: new mongoose.Types.ObjectId(),
    });

    await user1.save();
    await expect(user2.save()).rejects.toThrow('E11000 duplicate key error collection: test.users index: username_1 dup key: { username: \"testuser\" }');
  });
});
