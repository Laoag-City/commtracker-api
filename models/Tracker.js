const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Audit logs schema
const auditTrailSchema = new mongoose.Schema({
  action: { type: String, enum: ['create', 'update', 'delete'], required: true },
  timestamp: { type: Date, default: Date.now },
  modifiedBy: { type: String },
  changes: { type: Map, of: String }
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
  timestamps: true
});

// Tracker schema
const trackerSchema = new mongoose.Schema({
  serialNumber: { type: String, unique: true },
  fromName: { type: String, required: true },
  documentTitle: { type: String, required: true },
  dateReceived: { type: Date },
  attachment: { type: Schema.Types.ObjectId, ref: 'attachments' },
  attachmentMimeType: { type: String },
  isArchived: { type: Boolean, default: false },
  isConfidential: { type: Boolean, default: false },
  recipient: [recipientSchema],
  auditTrail: [auditTrailSchema],
}, {
  collection: 'communication-trackers',
  timestamps: true
});

// Pre-save hook to generate serial number and add audit trail
trackerSchema.pre('save', async function (next) {
  try {
    // Generate serial number for new documents
    if (this.isNew) {
      // Get current year
      const year = new Date().getFullYear().toString();
      // Get last 6 digits of the MongoDB _id
      const idPart = this._id.toString().slice(-6);
      // Combine to create serial number (e.g., "2025-123456")
      this.serialNumber = `${year}-${idPart}`;

      // Ensure serial number is unique
      const existingDoc = await this.constructor.findOne({ serialNumber: this.serialNumber });
      if (existingDoc) {
        // If collision occurs (very unlikely), append a random 2-digit number
        const randomSuffix = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        this.serialNumber = `${year}-${idPart}-${randomSuffix}`;
      }

      // Add create audit trail
      this.auditTrail.push({
        action: 'create',
        modifiedBy: 'System',
        changes: {}
      });
    } else if (this.isModified()) {
      // Add update audit trail
      const changes = {};
      this.modifiedPaths().forEach((path) => {
        if (path !== 'auditTrail') {
          changes[path] = this[path];
        }
      });
      this.auditTrail.push({
        action: 'update',
        modifiedBy: 'System',
        changes
      });
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Export the model
module.exports = mongoose.model('CommTrackers', trackerSchema);