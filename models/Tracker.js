const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Audit logs schema
const auditTrailSchema = new mongoose.Schema({
  action: { type: String, enum: ['create', 'update', 'delete'], required: true },
  timestamp: { type: Date, default: Date.now },
  modifiedBy: { type: String }, // User identifier (e.g., username, email)
  changes: { type: Map, of: String } // Stores changed fields and their new values
});

// Recipient schema
const recipientSchema = new mongoose.Schema({
  receivingDepartment: { type: Schema.Types.ObjectId, ref: 'Department' },
  receiveDate: { type: Date },
  isSeen: { type: Boolean, default: false },
  dateSeen: { type: Date },
  remarks: { type: String, default: '' },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'approved', 'rejected', 'in-progress', 'forwarded']
  }
}, {
  timestamps: true // Automatically include createdAt and updatedAt
});

// Tracker schema
const trackerSchema = new mongoose.Schema({
  fromName: { type: String, required: true },
  documentTitle: { type: String, required: true },
  dateReceived: { type: Date },
  attachment: { type: Schema.Types.ObjectId, ref: 'attachments' }, // GridFS reference for attachment
  attachmentMimeType: { type: String },
  isArchived: { type: Boolean, default: false },
  isConfidential: { type: Boolean, default: false },
  recipient: [recipientSchema],
  auditTrail: [auditTrailSchema],
}, {
  collection: 'communication-trackers',
  timestamps: true
});

// Pre-save hook to add audit trail
trackerSchema.pre('save', function (next) {
  if (this.isNew) {
    this.auditTrail.push({
      action: 'create',
      modifiedBy: 'System', // Default user or system identifier
      changes: {} // Initially empty for 'create' action
    });
  } else if (this.isModified()) {
    const changes = {};
    this.modifiedPaths().forEach((path) => {
      if (path !== 'auditTrail') { // Avoid including changes to the auditTrail itself
        changes[path] = this[path];
      }
    });
    this.auditTrail.push({
      action: 'update',
      modifiedBy: 'System', // Replace with actual user performing the action
      changes
    });
  }
  next();
});

// Export the model
module.exports = mongoose.model('CommTrackers', trackerSchema);
