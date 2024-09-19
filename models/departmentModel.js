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
  collection: 'departments'
});

module.exports = mongoose.model('Department', departmentSchema);
