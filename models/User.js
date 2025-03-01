const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Reference to Department schema
const ObjectId = mongoose.Schema.Types.ObjectId;

const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true, // Automatically creates a unique index
    lowercase: true, // Enforce lowercase for case-insensitivity
    trim: true, // Remove leading/trailing spaces
  },
  password: { 
    type: String, 
    required: true 
  },
  userrole: { 
    type: String, 
    required: true,
    default: 'recipient',
    enum: ['superadmin', 'admin', 'trackerreceiving', 'recipient', 'viewer', 'trackermonitor'], // Define allowed roles
  },
  deptId: { 
    type: ObjectId, 
    ref: 'Department', 
    required: true, 
  }, // Reference to Department _id
}, {
  collection: 'users',
  timestamps: true, // Adds createdAt and updatedAt fields
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 10); // Use 10 salt rounds
  }
  next();
});

// Compare hashed passwords
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Handle unique constraint error for username
UserSchema.post('save', function (error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('A user with this username already exists'));
  } else {
    next(error);
  }
});

module.exports = mongoose.model('User', UserSchema);
