// File path: controllers/Trackers.js
const CommTrackers = require('../models/Tracker');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { GridFSBucket } = require('mongodb');
const gridfsStream = require('gridfs-stream');

const commTrackersController = {

  createTracker: async (req, res) => {
    try {
      const { fromName, documentTitle, dateReceived, lceAction, lceActionDate, lceKeyedInAction, lceRemarks, recipient } = req.body;
      if (!fromName || !documentTitle || !dateReceived) {
        return res.status(400).json({ message: 'Required fields are missing' });
      }
      const user = req.body?.username || 'Unknown';

      let parsedRecipient;
      try {
        parsedRecipient = typeof recipient === "string" ? JSON.parse(recipient) : recipient;
      } catch (error) {
        return res.status(400).json({ message: 'Invalid recipient format' });
      }

      let fileId = null;
      if (req.file) {
        const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'attachments' });
        const uploadStream = bucket.openUploadStream(req.file.originalname, {
          contentType: req.file.mimetype,
          metadata: { user, documentTitle, fromName },
        });

        uploadStream.end(req.file.buffer);

        await new Promise((resolve, reject) => {
          uploadStream.on('finish', () => resolve());
          uploadStream.on('error', (err) => reject(err)); // Handle errors during upload
        });

        fileId = uploadStream.id;
      }

      const tracker = new CommTrackers({
        fromName, documentTitle, dateReceived, lceAction, lceActionDate, lceKeyedInAction, lceRemarks, recipient: parsedRecipient, attachment: fileId,
        attachmentMimeType: req.file ? req.file.mimetype : null,
        auditTrail: [{ action: 'create', modifiedBy: user, changes: { fromName, documentTitle, dateReceived } }],
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

      // Build the search query
      const searchQuery = {
        isArchived: { $ne: true }, // Exclude archived trackers
        ...(req.query.search
          ? { documentTitle: { $regex: req.query.search, $options: 'i' } }
          : {}),
      };

      const totalTrackers = await CommTrackers.countDocuments(searchQuery);
      const trackers = await CommTrackers.find(searchQuery)
        .populate('recipient.receivingDepartment')
        .sort({ dateReceived: -1 }) // Sort by dateReceived in descending order
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

  updateTrackerById: async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.body.username || 'Unknown';

      // Log incoming request data
      logger.info('Update tracker request:', {
        body: req.body,
        files: req.files ? req.files.file : null,
      });
      console.log('Request body:', req.body);
      console.log('Request files:', req.file);
      // Parse FormData fields
      const updateFields = {
        fromName: req.body.fromName,
        documentTitle: req.body.documentTitle,
        dateReceived: req.body.dateReceived,
        lceAction: req.body.lceAction,
        lceKeyedInAction: req.body.lceKeyedInAction,
        lceActionDate: req.body.lceActionDate,
        lceRemarks: req.body.lceRemarks,
      };
      //console.log("Update fields:", updateFields);
      // Parse recipient array
      let recipient = [];
      if (Array.isArray(req.body.recipient)) {
        // If recipient is already an array of objects, use it directly
        recipient = req.body.recipient;
      } else {
        // Fallback to existing logic for form-data with bracket notation
        for (const key in req.body) {
          if (key.startsWith('recipient[')) {
            const match = key.match(/recipient\[(\d+)\]\[(\w+)\]/);
            if (match) {
              const index = parseInt(match[1], 10);
              const field = match[2];
              if (!recipient[index]) {
                recipient[index] = {};
              }
              recipient[index][field] = req.body[key];
            } else {
              logger.warn(`Invalid recipient key format: ${key}`);
            }
          }
        }
      }

      // Log recipient before filtering
      logger.info('Raw recipient array:', { recipient });

      // Validate and parse recipient array
      const parsedRecipient = recipient
        .filter((rec, index) => {
          if (!rec || !rec.receivingDepartment) {
            logger.warn(`Recipient entry missing receivingDepartment at index ${index}:`, { entry: rec });
            return false;
          }
          // Validate ObjectId
          if (!mongoose.Types.ObjectId.isValid(rec.receivingDepartment)) {
            logger.warn(`Invalid ObjectId for receivingDepartment at index ${index}: ${rec.receivingDepartment}`);
            return false;
          }
          return true;
        })
        .map(rec => ({
          receivingDepartment: new mongoose.Types.ObjectId(rec.receivingDepartment),
          receiveDate: rec.receiveDate ? new Date(rec.receiveDate) : new Date(),
          status: rec.status || 'pending',
          remarks: rec.remarks || '',
        }));

      // Log parsed recipient
      logger.info('Parsed recipient array:', { parsedRecipient });

      // Validate required fields
      if (!updateFields.fromName || !updateFields.documentTitle || !updateFields.dateReceived) {
        logger.error('Missing required fields', { updateFields });
        return res.status(400).json({ message: 'Missing required fields: fromName, documentTitle, or dateReceived' });
      }
      if (!parsedRecipient.length) {
        logger.error('No valid recipient departments provided', { recipient });
        return res.status(400).json({ message: 'At least one valid recipient department is required' });
      }

      // Validate receivingDepartment IDs exist in departments collection
      const departmentIds = parsedRecipient.map(rec => rec.receivingDepartment);
      const existingDepartments = await mongoose.model('Department').find({
        _id: { $in: departmentIds },
      });
      if (existingDepartments.length !== departmentIds.length) {
        const missingIds = departmentIds.filter(
          id => !existingDepartments.some(dept => dept._id.equals(id))
        );
        logger.error('Invalid or non-existent department IDs:', { missingIds });
        return res.status(400).json({ message: `Invalid department IDs: ${missingIds.join(', ')}` });
      }

      // Handle file upload
      let fileId = null;
      let attachmentMimeType = null;
      if (req.files && req.files.file && req.files.file[0]) {
        const fileBuffer = req.files.file[0].buffer;
        attachmentMimeType = req.files.file[0].mimetype;
        const bucket = new GridFSBucket(mongoose.connection.db, {
          bucketName: 'attachments',
        });
        const uploadStream = bucket.openUploadStream(req.files.file[0].originalname, {
          contentType: attachmentMimeType,
          metadata: { user },
        });
        uploadStream.end(fileBuffer);
        await new Promise((resolve, reject) => {
          uploadStream.on('finish', () => resolve());
          uploadStream.on('error', (err) => reject(err));
        });
        fileId = uploadStream.id;
        logger.info(`Uploaded file: ${req.files.file[0].originalname}, ID: ${fileId}`);
      }

      // Fetch original tracker
      const originalTracker = await CommTrackers.findById(id);
      if (!originalTracker) {
        logger.error('Tracker not found', { trackerId: id });
        return res.status(404).json({ message: 'Tracker not found' });
      }

      // Track changes for audit trail
      const changes = {};
      for (const key in updateFields) {
        if (updateFields[key] && updateFields[key] !== originalTracker[key]) {
          changes[key] = String(updateFields[key]); // Convert to string
        }
      }
      if (fileId && fileId.toString() !== originalTracker.attachment?.toString()) {
        changes.attachment = fileId.toString(); // Convert ObjectId to string
      }
      if (
        parsedRecipient.length !== originalTracker.recipient.length ||
        parsedRecipient.some(
          (rec, i) =>
            rec.receivingDepartment.toString() !==
            originalTracker.recipient[i]?.receivingDepartment?.toString()
        )
      ) {
        // Convert recipient array to a JSON string
        changes.recipient = JSON.stringify(
          parsedRecipient.map(rec => ({
            receivingDepartment: rec.receivingDepartment.toString(), // Convert ObjectId to string
            receiveDate: rec.receiveDate instanceof Date ? rec.receiveDate.toISOString() : rec.receiveDate,
            status: rec.status,
            remarks: rec.remarks,
          }))
        );
      }

      // Prepare update object
      const updateData = {
        ...updateFields,
        recipient: parsedRecipient,
        ...(fileId && { attachment: fileId }),
        ...(attachmentMimeType && { attachmentMimeType }),
        $push: {
          auditTrail: {
            action: 'update',
            modifiedBy: user,
            changes, // All values in changes are now strings
          },
        },
      };

      // Update tracker
      const updatedTracker = await CommTrackers.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('recipient.receivingDepartment');

      if (!updatedTracker) {
        logger.error('Failed to update tracker', { trackerId: id });
        return res.status(404).json({ message: 'Failed to update tracker' });
      }

      logger.info(`Tracker updated: ${id}, by user: ${user}`);
      res.status(200).json(updatedTracker);
    } catch (error) {
      logger.error('Error updating tracker', { error: error.message, stack: error.stack });
      res.status(400).json({ message: 'Error updating tracker', error: error.message });
    }
  },
  // Update a recipient array using tracker ID
  updateRecipientByTrackerId: async (req, res) => {
    try {
      const { id: trackerId, recipientid: recipientId } = req.params;
      const { status, isSeen, remarks, username } = req.body;
      const user = username || 'Unknown';
      if (!mongoose.Types.ObjectId.isValid(trackerId) || !mongoose.Types.ObjectId.isValid(recipientId)) {
        return res.status(400).json({ error: 'Invalid trackerId or recipientId.' });
      }
      const allowedStatuses = ['pending', 'approved', 'rejected', 'in-progress', 'forwarded'];
      if (status && !allowedStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status value.' });
      }

      const changes = {};
      if (status) changes['status'] = status;
      if (typeof isSeen !== 'undefined') changes['isSeen'] = isSeen === 'true';
      if (remarks) changes['remarks'] = remarks;

      const result = await CommTrackers.updateOne(
        { _id: trackerId, 'recipient._id': recipientId },
        {
          $set: {
            'recipient.$.status': status,
            'recipient.$.isSeen': isSeen === 'true',
            'recipient.$.remarks': remarks,
          },
          $push: {
            auditTrail: {
              action: 'update-recipient',
              modifiedBy: user,
              changes,
              timestamp: new Date(),
            },
          },
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Tracker or recipient not found.' });
      }
      return res.status(200).json({ message: result.modifiedCount > 0 ? 'Recipient data updated successfully.' : 'No changes were made.' });
    } catch (error) {
      logger.error('Error updating recipient data', { error: error.message });
      return res.status(500).json({ error: 'An error occurred while updating recipient data.' });
    }
  },
  // Filter trackers by recipient fields with pagination
  filterReceivingDepartments: async (req, res) => {
    try {
      const { receivingDepartment, status, isSeen, dateSeenFrom, dateSeenTo, page = 1, limit = 10 } = req.query;

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

      //console.log('Constructed Filter:', recipientFilter);

      // Convert page & limit to integers
      const pageNumber = parseInt(page, 10);
      const pageSize = parseInt(limit, 10);
      const skip = (pageNumber - 1) * pageSize;

      const results = await CommTrackers.aggregate([
        { $unwind: '$recipient' },
        { $match: recipientFilter }, // Apply filters
        {
          $sort: { 'dateReceived': -1 } // Sort by receiveDate in descending order
        },
        {
          $lookup: {
            from: 'departments',
            localField: 'recipient.receivingDepartment',
            foreignField: '_id',
            as: 'departmentDetails',
          },
        },
        { $unwind: { path: '$departmentDetails', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$_id',
            fromName: { $first: '$fromName' },
            documentTitle: { $first: '$documentTitle' },
            dateReceived: { $first: '$dateReceived' },
            lceAction: { $first: '$lceAction' },
            lceActionDate: { $first: '$lceActionDate' },
            lceKeyedInAction: { $first: '$lceKeyedInAction' },
            lceRemarks: { $first: '$lceRemarks' },
            dateCreated: { $first: '$createdAt' },
            dateUpdated: { $first: '$updatedAt' },
            serialNumber: { $first: '$serialNumber' },
            status: { $first: '$status' },
            isArchived: { $first: '$isArchived' },
            attachment: { $first: '$attachment' },
            attachmentMimeType: { $first: '$attachmentMimeType' },
            recipients: {
              $push: {
                recipientId: '$recipient._id',
                receivingDepartment: '$recipient.receivingDepartment',
                receiveDate: '$recipient.receiveDate',
                isSeen: '$recipient.isSeen',
                dateSeen: '$recipient.dateSeen',
                remarks: '$recipient.remarks',
                status: '$recipient.status',
                departmentDetails: '$departmentDetails',
              },
            },
          },
        },
        {
          $facet: {
            paginatedResults: [{ $skip: skip }, { $limit: pageSize }], // Pagination
            totalCount: [{ $count: 'count' }], // Total count
          },
        },
      ]);

      const paginatedResults = results[0].paginatedResults || [];
      const totalCount = results[0].totalCount.length > 0 ? results[0].totalCount[0].count : 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      res.status(200).json({
        success: true,
        currentPage: pageNumber,
        totalPages,
        totalRecords: totalCount,
        data: paginatedResults,
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

      // Fetch tracker to get attachment ID
      const tracker = await CommTrackers.findById(id);
      if (!tracker || !tracker.attachment) {
        return res.status(404).json({ message: "Attachment not found" });
      }

      const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: "attachments" });

      // Fetch file metadata
      const file = await bucket.find({ _id: tracker.attachment }).toArray();
      if (!file || file.length === 0) {
        return res.status(404).json({ message: "Attachment metadata not found" });
      }

      const fileName = file[0].filename || "attachment";
      const mimeType = tracker.attachmentMimeType || "application/octet-stream";

      // Determine if file should be displayed inline or downloaded
      const isViewable = ["application/pdf", "image/png", "image/jpeg"].includes(mimeType);
      const disposition = isViewable ? "inline" : `attachment; filename="DTS-${fileName}"`;

      // Set headers
      res.set({
        "Content-Type": mimeType,
        "Content-Disposition": disposition,
      });

      // Stream file to client
      const downloadStream = bucket.openDownloadStream(tracker.attachment);
      downloadStream.on("error", (err) => {
        res.status(500).json({ message: "Error streaming attachment", error: err.message });
      });

      downloadStream.pipe(res);
    } catch (error) {
      logger.error("Error fetching attachment", { error: error.message });
      res.status(500).json({ message: "Error fetching attachment", error: error.message });
    }
  },
  // Serve an attachment with Auth
  getAttachmentWithAuth: async (req, res) => {
    try {
      const { id } = req.params;

      // Fetch tracker by ID
      const tracker = await CommTrackers.findById(id);
      if (!tracker || !tracker.attachment) {
        return res.status(404).json({ message: "Attachment not found" });
      }

      const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'attachments' });

      // Fetch file metadata
      const file = await bucket.find({ _id: tracker.attachment }).toArray();
      if (!file || file.length === 0) {
        return res.status(404).json({ message: "Attachment metadata not found" });
      }

      const fileName = file[0].filename || 'attachment';
      const mimeType = tracker.attachmentMimeType || "application/octet-stream";

      const dateReceived = new Date(tracker.dateReceived).toISOString().split("T")[0]; // Format as YYYY-MM-DD
      const mimeTypeToExtension = {
        "application/pdf": "pdf",
        "image/jpeg": "jpg",
        "image/png": "png",
      };
      const extension = mimeTypeToExtension[mimeType] || "txt"; // Fallback to '.txt' if unknown
      const filename = `dts-${dateReceived}.${extension}`;

      // Set headers
      res.set("Content-Type", mimeType);
      res.set("Content-Disposition", `attachment; filename="${filename}"`);

      // Stream file to client
      const downloadStream = bucket.openDownloadStream(tracker.attachment);
      downloadStream.on("error", () => {
        res.status(404).json({ message: "Error streaming attachment" });
      });
      downloadStream.pipe(res);
    } catch (error) {
      console.error("Error serving attachment:", error);
      res.status(500).json({ message: "Error serving attachment", error: error.message });
    }

  },
  // Unauthenticated route to get tracker status
  getTrackerStatusById: async (req, res) => {
    try {
      const { id } = req.params;
      //console.log(id);
      // Populate recipient array
      const tracker = await CommTrackers.findById(id)
        .select('status serialNumber dateReceived lceAction lceActionDate lceKeyedInAction lceRemarks documentTitle isArchived recipient ') // Specify the fields to return
        .populate({
          path: 'recipient.receivingDepartment',
          select: 'deptName', // Fields to return within recipient subdocument
        });
      // Find the tracker by ID
      if (!tracker) {
        return res.status(404).json({ message: "Document Tracker ID is invalid or does not exist" });
      }
      // Check if tracker is archived
      if (tracker.isArchived) {
        return res.status(404).json({ message: "This document tracker is archived and cannot be viewed" });
      }
      // TODO: filter some unrelated data
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
