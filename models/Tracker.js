const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Audit logs
const auditTrailSchema = new mongoose.Schema({
  action: { type: String, enum: ['create', 'update', 'delete'], required: true },
  timestamp: { type: Date, default: Date.now },
  modifiedBy: { type: String }, // User identifier (e.g., username, email)
  changes: { type: Map, of: String } // Stores changed fields and their new values
});

// Recipient Schema
const recipientSchema = new mongoose.Schema({
  receivingDepartment: { type: Schema.Types.ObjectId, ref: 'Department' },
  receiveDate: { type: Date },
  isSeen: { type: Boolean, default: false },
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
  attachmentMimeType: {type: String},
  isArchived: { type: Boolean, default: false },
  isConfidential:{type: Boolean, default: false },
  recipient: [recipientSchema],
  auditTrail: [auditTrailSchema],
}, {
  collection: 'communication-trackers',
  timestamps: true
});

// Add audit trail to the tracker schema
//trackerSchema.add({
//  
//});
// Export Model
module.exports = mongoose.model('CommTrackers', trackerSchema);
