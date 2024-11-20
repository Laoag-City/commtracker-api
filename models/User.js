const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Reference to Department schema
const ObjectId = mongoose.Schema.Types.ObjectId;

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userrole: { type: String, required: true},
  deptId: { type: ObjectId, ref: 'Department', required: true }, // Reference to Department _id
},{collection: 'users',
  timestamps: true
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
    next(new Error('Username already exists'));
  } else {
    next(error);
  }
});

// Add an index for faster lookups
UserSchema.index({ username: 1 });

module.exports = mongoose.model('User', UserSchema);
