const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Recipient Schema
const recipientSchema = new mongoose.Schema({
  receivingDepartment: { type: Schema.Types.ObjectId, ref: 'Department' },
  seenDate:{ type: Date },
  receiveDate: { type: Date },
  isSeen: { type: Boolean },
  dateSeen:{ type: Date },
  remarks: { type: String, default: '' },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'approved', 'rejected', 'in-progress','forwarded']
  }
}, {
  timestamps: true 
});

// Tracker Schema
const trackerSchema = new mongoose.Schema({
  fromName: { type: String, required: true },
  documentTitle: { type: String, required: true },
  dateReceived: { type: Date },
  attachment: { type: Buffer, required: false },
  isArchived: { type: Boolean },
  recipient: [recipientSchema]
}, {
  collection: 'communication-trackers',
  timestamps: true
});

// Export Model
module.exports = mongoose.model('CommTrackers', trackerSchema);
