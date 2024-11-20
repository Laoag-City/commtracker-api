const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  deptCode: {
    type: Number,
    required: true,
    unique: true,
  },
  deptName: {
    type: String,
    required: true,
  }
}, {
  collection: 'departments',
  timestamps: true
});

module.exports = mongoose.model('Department', departmentSchema);
