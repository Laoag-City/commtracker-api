// File path: controllers/Trackers.js
const CommTrackers = require('../models/Tracker');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { GridFSBucket } = require('mongodb');
const gridfsStream = require('gridfs-stream');

const commTrackersController = {

  // Create a new tracker
  createTracker: async (req, res) => {
    try {
      const { fromName, documentTitle, dateReceived, recipient } = req.body;
      const user = req.body?.username || 'Unknown'; // Assuming user info is in `req.user`

      //console.log(req.body?.username);
      //console.log(user);
      //console.log(req.body)

      const parsedRecipient = typeof recipient === "string" ? JSON.parse(recipient) : recipient;

      if (!fromName || !documentTitle || !dateReceived) {
        return res.status(400).json({ message: 'Required fields are missing' });
      }

      let fileId = null;
      if (req.file) {
        const fileBuffer = req.file.buffer;
        const fileMimeType = req.file.mimetype;

        // Initialize GridFS Bucket
        const bucket = new GridFSBucket(mongoose.connection.db, {
          bucketName: 'attachments'
        });

        const uploadStream = bucket.openUploadStream(req.file.originalname, {
          contentType: fileMimeType,
          metadata: { user: user, documentTitle, fromName }
        });

        uploadStream.end(fileBuffer);
        fileId = uploadStream.id; // Get the fileId from GridFS
      }

      const tracker = new CommTrackers({
        fromName,
        documentTitle,
        dateReceived,
        recipient: parsedRecipient,
        attachment: fileId,
        attachmentMimeType: req.file ? req.file.mimetype : null,
        auditTrail: [
          {
            action: 'create',
            modifiedBy: user,
            changes: { fromName, documentTitle, dateReceived }, // Do not include attachments
          },
        ],
      });

      const savedTracker = await tracker.save();
      res.status(201).json(savedTracker);
      logger.info('Tracker document created successfully', { trackerId: tracker._id });
    } catch (error) {
      logger.error('Error creating Tracker document', { error: error.message });
      res.status(400).json({ message: 'Error creating tracker', error: error.message });
    }
  },

  // Get all trackers with pagination and optional search
  getAllTrackers: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 25;
      const skip = (page - 1) * limit;
      const searchQuery = req.query.search
        ? { documentTitle: { $regex: req.query.search, $options: 'i' } }
        : {};

      const totalTrackers = await CommTrackers.countDocuments(searchQuery);
      const trackers = await CommTrackers.find(searchQuery)
        .populate('recipient.receivingDepartment')
        .skip(skip)
        .limit(limit);

      const totalPages = Math.ceil(totalTrackers / limit);

      res.status(200).json({
        trackers,
        metadata: {
          totalTrackers,
          totalPages,
          currentPage: page,
          itemsPerPage: limit,
        },
      });
      logger.info('Trackers fetched successfully', { totalTrackers });
    } catch (error) {
      logger.error('Error fetching trackers', { error: error.message });
      res.status(500).json({ message: 'Error fetching trackers', error: error.message });
    }
  },

  // Get a tracker by ID
  getTrackerById: async (req, res) => {
    try {
      const { id } = req.params;
      const tracker = await CommTrackers.findById(id).populate('recipient.receivingDepartment');
      if (!tracker) {
        return res.status(404).json({ message: 'Tracker not found' });
      }
      res.status(200).json(tracker);
      logger.info('Tracker fetched successfully', { trackerId: id });
    } catch (error) {
      logger.error('Error fetching tracker', { error: error.message });
      res.status(500).json({ message: 'Error fetching tracker', error: error.message });
    }
  },
  // Update a tracker
  // TODO: Add validation for recipient object
  updateTrackerById: async (req, res) => {
    try {
      const { id } = req.params;
      const { recipient, ...updateFields } = req.body;
      const user = req.body?.username || 'Unknown';
      const parsedRecipient = typeof recipient === "string" ? JSON.parse(recipient) : recipient;

      // Initialize GridFS Bucket if a new file is provided
      let fileId = null;
      if (req.file) {
        const fileBuffer = req.file.buffer;
        const fileMimeType = req.file.mimetype;

        const bucket = new GridFSBucket(mongoose.connection.db, {
          bucketName: 'attachments'
        });

        const uploadStream = bucket.openUploadStream(req.file.originalname, {
          contentType: fileMimeType,
          metadata: { user: user }
        });

        uploadStream.end(fileBuffer);
        fileId = uploadStream.id; // Get the fileId from GridFS
      }

      const originalTracker = await CommTrackers.findById(id);
      if (!originalTracker) {
        return res.status(404).json({ message: "Tracker not found" });
      }

      const changes = {};
      for (const key in updateFields) {
        if (updateFields[key] !== originalTracker[key]) {
          changes[key] = updateFields[key];
        }
      }

      if (fileId) {
        updateFields.attachment = fileId;
      }

      const updatedTracker = await CommTrackers.findByIdAndUpdate(
        id,
        {
          ...updateFields,
          recipient: parsedRecipient,
          $push: {
            auditTrail: {
              action: 'update',
              modifiedBy: user,
              changes,
            },
          },
        },
        { new: true, runValidators: true }
      );

      res.status(200).json(updatedTracker);
    } catch (error) {
      logger.error('Error updating tracker', { error: error.message });
      res.status(400).json({ message: 'Error updating tracker', error: error.message });
    }
  },
  // Update a recipient array using tracker ID
  updateRecipientByTrackerId: async (req, res) => {
    //TODO: validate the recipient object
    //API Path = /trackers/:id/recipient/:recipientid
    const { id: trackerId, recipientid: recipientId } = req.params;
    const { status, isSeen, remarks, username: user } = req.body;

    // Validate status
    const allowedStatuses = ['pending', 'approved', 'rejected', 'in-progress', 'forwarded'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid or missing status value.' });
    }
    // Validate MongoDB ObjectIDs
    if (!mongoose.Types.ObjectId.isValid(trackerId) || !mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ error: 'Invalid trackerId or recipientId.' });
    }

    try {
      // Update recipient status
      // Prepare changes for audit trail
      const changes = {};
      if (status) changes['status'] = status;
      if (typeof isSeen !== 'undefined') changes['isSeen'] = isSeen;
      if (remarks) changes['remarks'] = remarks;

      const result = await CommTrackers.updateOne(
        { _id: trackerId, 'recipient._id': recipientId },
        {
          $set: {
            'recipient.$.status': status,
            'recipient.$.isSeen': isSeen,
            'recipient.$.remarks': remarks,
          },
          $push: {
            auditTrail: {
              action: 'update-recipient',
              modifiedBy: user || 'Unknown',
              changes, // Record the changes made
              timestamp: new Date(),
            },
          },
        }
      );
      // Handle response
      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Tracker or recipient not found.' });
      }
      if (result.modifiedCount > 0) {
        return res.status(200).json({ message: 'Recipient data updated successfully.' });
      } else {
        return res.status(200).json({ message: 'No changes were made to the recipient data.' });
      }
    } catch (error) {
      console.error('Error updating recipient data:', error.message);
      return res
        .status(500)
        .json({ error: 'An error occurred while updating recipient data.' });
    }
  },
  /**
  * Filter receivingDepartment records
  * @param {Object} req - Express request object
  * @param {Object} res - Express response object
  */
  // Filter receivingDepartment records
  // TODO add department name to the response
  filterReceivingDepartments: async (req, res) => {
    try {
      const { receivingDepartment, status, isSeen, dateSeenFrom, dateSeenTo } = req.query;

      // Log incoming query params for debugging
      console.log('Query Params:', req.query);
      console.log(receivingDepartment);
      console.log(status);
      console.log(isSeen);
      console.log(dateSeenFrom);
      console.log(dateSeenTo);
      console.log(req.query);

      // Build the filter criteria
      const recipientFilter = {};
      if (receivingDepartment) {
        recipientFilter['recipient.receivingDepartment'] = new mongoose.Types.ObjectId(receivingDepartment);
      }
      if (status) {
        recipientFilter['recipient.status'] = status;
      }
      if (isSeen !== undefined) {
        recipientFilter['recipient.isSeen'] = isSeen === 'true';
      }
      if (dateSeenFrom || dateSeenTo) {
        recipientFilter['recipient.dateSeen'] = {};
        if (dateSeenFrom) recipientFilter['recipient.dateSeen'].$gte = new Date(dateSeenFrom);
        if (dateSeenTo) recipientFilter['recipient.dateSeen'].$lte = new Date(dateSeenTo);
      }

      console.log('Constructed Filter:', recipientFilter);

      // Use aggregation pipeline to filter nested recipient array
      // TODO: add the attachment object as well
      const results = await CommTrackers.aggregate([
        { $unwind: '$recipient' },
        { $match: recipientFilter }, // Apply filter
        {
          $project: {
            fromName: 1,
            documentTitle: 1,
            recipient: 1,
          },
        },
      ]);

      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error) {
      console.error('Error filtering receiving departments:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  },

  // Get audit trail logs for a tracker
  getAuditTrail: async (req, res) => {
    const { id } = req.params;

    try {
      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid tracker ID' });
      }

      // Fetch audit logs
      const tracker = await CommTrackers.findById(id, { auditTrail: 1 });

      if (!tracker || tracker.auditTrail.length === 0) {
        return res.status(404).json({ error: 'No audit logs found' });
      }

      res.status(200).json({
        success: true,
        data: tracker.auditTrail,
      });
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  deleteTrackerById: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedTracker = await CommTrackers.findByIdAndDelete(id);
      if (!deletedTracker) {
        return res.status(404).json({ message: 'Tracker not found' });
      }
      res.status(200).json({ message: 'Tracker deleted successfully' });
      logger.info('Tracker deleted successfully', { trackerId: id });
    } catch (error) {
      logger.error('Error deleting tracker', { error: error.message });
      res.status(500).json({ message: 'Error deleting tracker', error: error.message });
    }
  },
  // Serve an attachment
  getAttachment: async (req, res) => {
    try {
      const { id } = req.params;

      const tracker = await CommTrackers.findById(id);
      if (!tracker || !tracker.attachment) {
        return res.status(404).json({ message: 'Attachment not found' });
      }

      // Initialize GridFS Bucket to fetch file
      const bucket = new GridFSBucket(mongoose.connection.db, {
        bucketName: 'attachments'
      });

      const downloadStream = bucket.openDownloadStream(tracker.attachment);
      downloadStream.on('error', (error) => {
        return res.status(404).json({ message: 'Error fetching attachment', error: error.message });
      });

      // Set file headers
      const file = await bucket.find({ _id: tracker.attachment }).toArray();
      const fileName = file[0]?.filename || 'attachment';
      res.set('Content-Disposition', `attachment; filename=${fileName}`);
      downloadStream.pipe(res);
    } catch (error) {
      logger.error('Error fetching attachment', { error: error.message });
      res.status(500).json({ message: 'Error fetching attachment', error: error.message });
    }
  },
  // Serve an attachment with Auth
  getAttachmentWithAuth: async (req, res) => {
    try {
      const { id } = req.params;

      // Find the tracker by ID
      const tracker = await CommTrackers.findById(id);
      if (!tracker || !tracker.attachment) {
        return res.status(404).json({ message: "Attachment not found" });
      }

      // Initialize GridFS Bucket to fetch file
      const bucket = new GridFSBucket(mongoose.connection.db, {
        bucketName: 'attachments'
      });

      const downloadStream = bucket.openDownloadStream(tracker.attachment);
      downloadStream.on('error', (error) => {
        return res.status(404).json({ message: 'Error fetching attachment', error: error.message });
      });

      // Extract dateReceived and mimetype for filename
      const dateReceived = new Date(tracker.dateReceived).toISOString().split("T")[0]; // Format as YYYY-MM-DD
      const mimeTypeToExtension = {
        "application/pdf": "pdf",
        "image/jpeg": "jpg",
        "image/png": "png",
      };
      const extension = mimeTypeToExtension[tracker.attachmentMimeType] || "txt"; // Default to 'txt' if mimetype is unknown
      const filename = `dts-${dateReceived}.${extension}`;

      // Set appropriate headers
      //res.set("Content-Type", tracker.attachmentMimeType);
      //res.set("Content-Disposition", `attachment; filename="${filename}"`);
      const file = await bucket.find({ _id: tracker.attachment }).toArray();
      const fileName = file[0]?.filename || 'attachment';
      // Stream the attachment
      res.set('Content-Disposition', `attachment; filename=${fileName}`);
      downloadStream.pipe(res);
      // res.send(tracker.attachment);
    } catch (error) {
      console.error("Error serving attachment:", error);
      res.status(500).json({ message: "Error serving attachment" });
    }
    //console.log(res);
  },
  // Unauthenticated route to get tracker status
  getTrackerStatusById: async (req, res) => {
    try {
      const { id } = req.params;
      console.log(id);
      // Populate recipient array
      const tracker = await CommTrackers.findById(id)
        .select('status dateReceived documentTitle isArchived recipient') // Specify the fields to return
        .populate({
          path: 'recipient.receivingDepartment',
          select: 'deptName', // Fields to return within recipient subdocument
        });
      // Find the tracker by ID
      if (!tracker) {
        return res.status(404).json({ message: "Document Tracker ID or invalid" });
      }
      // TODO: return some data only related to status
      res.status(200).json(tracker);
      logger.info('Tracker fetched successfully', { trackerId: id });
    } catch (error) {
      logger.error('Error fetching tracker', { error: error.message });
      res.status(500).json({ message: 'Error fetching tracker', error: error.message });
    }
    //console.log(res);
  }
};

module.exports = commTrackersController;
