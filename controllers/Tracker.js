// File path: controllers/Trackers.js
const CommTrackers = require('../models/Tracker');
const logger = require('../utils/logger');

const commTrackersController = {

  // Create a new tracker
  createTracker: async (req, res) => {
    try {
      const { fromName, documentTitle, dateReceived, recipient } = req.body;
      //const user = req.user?.name || 'Unknown'; // Assuming user info is in `req.user`
      const user = req.body?.username || 'Unknown'; // Assuming user info is in `req.user`
      //console.log(req.body?.username);
      //console.log(user);
      //console.log(req.body)
  
      const parsedRecipient = typeof recipient === "string" ? JSON.parse(recipient) : recipient;
  
      if (!fromName || !documentTitle || !dateReceived) {
        return res.status(400).json({ message: 'Required fields are missing' });
      }
  
      const tracker = new CommTrackers({
        fromName,
        documentTitle,
        dateReceived,
        recipient: parsedRecipient,
        attachment: req.file ? req.file.buffer : null,
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
  updateTrackerById: async (req, res) => {
    try {
      const { id } = req.params; // Tracker ID
      const { recipientId, ...updateFields } = req.body; // Extract recipientId and other fields
      const user = req.body?.username || "Unknown"; // Assuming user info is in req.body
  
      // Validate tracker ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid tracker ID." });
      }
  
      // Validate recipient ID if provided
      if (recipientId && !mongoose.Types.ObjectId.isValid(recipientId)) {
        return res.status(400).json({ message: "Invalid recipient ID." });
      }
  
      // Check if the tracker exists
      const tracker = await CommTrackers.findById(id);
      if (!tracker) {
        return res.status(404).json({ message: "Tracker not found." });
      }
  
      let recipientUpdateResult = null;
  
      // Handle recipient-specific updates
      if (recipientId) {
        const { recipientUpdates } = req.body; // Expected to contain the fields to update for the recipient
        if (!recipientUpdates || typeof recipientUpdates !== "object") {
          return res.status(400).json({ message: "Invalid recipient updates." });
        }
  
        // Update specific recipient using $ positional operator
        recipientUpdateResult = await CommTrackers.updateOne(
          { _id: id, "recipient._id": recipientId },
          {
            $set: Object.entries(recipientUpdates).reduce(
              (acc, [key, value]) => ({ ...acc, [`recipient.$.${key}`]: value }),
              {}
            ),
            $push: {
              auditTrail: {
                action: "update-recipient",
                modifiedBy: user,
                changes: { recipientId, ...recipientUpdates },
              },
            },
          }
        );
  
        // Check if the recipient was updated
        if (recipientUpdateResult.matchedCount === 0) {
          return res.status(404).json({ message: "Recipient not found in tracker." });
        }
      }
  
      // Update tracker-level fields if provided
      if (Object.keys(updateFields).length > 0) {
        // Exclude attachment fields from audit log
        const changes = {};
        for (const key in updateFields) {
          if (
            key !== "attachment" &&
            key !== "attachmentMimeType" &&
            updateFields[key] !== tracker[key]
          ) {
            changes[key] = updateFields[key];
          }
        }
  
        // Include attachment if provided
        if (req.file) {
          updateFields.attachment = req.file.buffer;
          updateFields.attachmentMimeType = req.file.mimetype;
        }
  
        const updatedTracker = await CommTrackers.findByIdAndUpdate(
          id,
          {
            ...updateFields,
            $push: {
              auditTrail: {
                action: "update",
                modifiedBy: user,
                changes,
              },
            },
          },
          { new: true, runValidators: true }
        );
  
        if (!updatedTracker) {
          return res.status(404).json({ message: "Tracker not found for update." });
        }
  
        return res.status(200).json({
          message: "Tracker and recipient updated successfully.",
          recipientUpdateResult,
          updatedTracker,
        });
      }
  
      // If no tracker-level fields are updated, return recipient update result
      res.status(200).json({
        message: "Recipient updated successfully.",
        recipientUpdateResult,
      });
    } catch (error) {
      logger.error("Error updating tracker", { error: error.message });
      res.status(500).json({ message: "Error updating tracker", error: error.message });
    }
/* Old Code   
    try {
      const { id } = req.params;
      const { recipient, ...updateFields } = req.body;
      //const user = req.user?.name || 'Unknown'; // Assuming user info is in `req.user`
      const user = req.body?.username || 'Unknown'; // Assuming user info is in `req.user`
      //console.log(req.body?.username);
      //console.log(user);
      //console.log(req.body)
 
      const parsedRecipient = typeof recipient === "string" ? JSON.parse(recipient) : recipient;
  
      // Include attachment if provided, but do not include it in the audit log
      if (req.file) {
        updateFields.attachment = req.file.buffer;
        updateFields.attachmentMimeType = req.file.mimetype;
      }
  
      const originalTracker = await CommTrackers.findById(id);
      if (!originalTracker) {
        return res.status(404).json({ message: "Tracker not found" });
      }
  
      // Filter out attachment-related fields from the audit log
      const changes = {};
      for (const key in updateFields) {
        if (key !== "attachment" && key !== "attachmentMimeType" && updateFields[key] !== originalTracker[key]) {
          changes[key] = updateFields[key];
        }
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
      logger.error("Error updating tracker", { error: error.message });
      res.status(400).json({ message: "Error updating tracker", error: error.message });
    }
 */
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
  
      // Find the tracker by ID
      const tracker = await CommTrackers.findById(id);
      if (!tracker || !tracker.attachment) {
        return res.status(404).json({ message: 'Attachment not found' });
      }
  
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
        res.set("Content-Type", tracker.attachmentMimeType);
        res.set("Content-Disposition", `attachment; filename="${filename}"`);
    
        // Stream the attachment  
      res.send(tracker.attachment);
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
      res.set("Content-Type", tracker.attachmentMimeType);
      res.set("Content-Disposition", `attachment; filename="${filename}"`);
    
      // Stream the attachment
      res.send(tracker.attachment);
       } catch (error) {
        console.error("Error serving attachment:", error);
        res.status(500).json({ message: "Error serving attachment" });
      }
      //console.log(res);
    },
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
      if (!tracker ) {
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
