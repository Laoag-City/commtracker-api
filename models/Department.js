const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  deptCode: {
    type: Number,
    required: true,
    unique: true,
    min: 1 // Example validation: deptCode must be positive
  },
  deptName: {
    type: String,
    required: true,
    unique: true, // Ensure no duplicate department names
    maxlength: 100 // Optional: limit string length
  },
  initial: {
    type: String,
    required: false,
  }
}, {
  collection: 'departments',
  timestamps: true
});

module.exports = mongoose.model('Department', departmentSchema);
