const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const groupSchema = new mongoose.Schema({
  groupName: { type: String, required: true },
  departmentIds: [{ type: Schema.Types.ObjectId, ref: 'Department', required: true }]
}, {
  collection: 'groups',
  timestamps: true
});

module.exports = mongoose.model('Group', groupSchema);
