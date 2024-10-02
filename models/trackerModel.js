const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const signatorySchema = new mongoose.Schema({
  signatory: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  signDate: { type: Date, default: Date.now },
  remarks: { type: String, default: '' },
  status: { type: String, default: '' }
});

const trackerSchema = new mongoose.Schema({
  owner: { type: String, required: true },
  title: { type: String, required: true },
  dateApplied: { type: Date, default: Date.now },
  conversionStatus: { type: Boolean, default: false },
  cPermitStatus: { type: Boolean, default: false },
  cPermitType: { type: String, default: '' },
  ownerName: { type: String, required: true },
  applicationTitle: { type: String, required: true },
  constructionPermitSignatories: [signatorySchema]
}, {
  collection: 'oscp-tracker',
  timestamps: true
});

module.exports = mongoose.model('OSCPTracker', trackerSchema);
