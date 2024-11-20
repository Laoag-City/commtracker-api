const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Recipient Schema
const signatorySchema = new mongoose.Schema({
  receivingDepartment: { type: Schema.Types.ObjectId, ref: 'Department' },
  receiveDate: { type: Date, default: Date.now },
  remarks: { type: String, default: '' },
  status: {
    type: String,
    default: '',
    enum: ['pending', 'approved', 'rejected', 'in-progress'] // Optional: Add valid statuses
  }
}, {
  timestamps: true // Enables createdAt and updatedAt fields
});

// Tracker Schema
const trackerSchema = new mongoose.Schema({
  fromName: { type: String, required: true },
  documentTitle: { type: String, required: true },
  dateReceived: { type: Date, default: Date.now },
  attachment: { type: Buffer, required: false }, // Consider external file storage
  recipient: [signatorySchema]
}, {
  collection: 'communication-trackers',
  timestamps: true
});

// Export Model
module.exports = mongoose.model('CommTrackers', trackerSchema);
