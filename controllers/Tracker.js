// File path: controllers/Trackers.js
const CommTrackers = require('../models/Tracker');
const logger = require('../utils/logger');

const commTrackersController = {
  // Create a new tracker

  createTracker: async (req, res) => {
    try {
      const { fromName, documentTitle, dateReceived, recipient } = req.body;

      // Parse the recipient field if it is a JSON string
      const parsedRecipient = typeof recipient === "string" ? JSON.parse(recipient) : recipient;

      // Validate required fields
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
      });

      console.log(req.body.recipient);
      console.log(parsedRecipient);

      const savedTracker = await tracker.save();
      res.status(201).json(savedTracker);
      logger.info('Tracker document created successfully', { trackerId: tracker._id });
    } catch (error) {
      logger.error('Error creating Tracker document', { error: error.message });
      res.status(400).json({ message: 'Error creating tracker', error: error.message });
      console.log(req.body.recipient);
      console.log(parsedRecipient);
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
      const { id } = req.params;
      const { recipient, ...updateFields } = req.body;
  
      // Parse the recipient field if it is a JSON string
      const parsedRecipient = typeof recipient === "string" ? JSON.parse(recipient) : recipient;
  
      // Include attachment if provided
      if (req.file) {
        updateFields.attachment = req.file.buffer;
        updateFields.attachmentMimeType = req.file.mimetype;
      }
  
      // Update the tracker
      const updatedTracker = await CommTrackers.findByIdAndUpdate(
        id,
        { ...updateFields, recipient: parsedRecipient },
        { new: true, runValidators: true }
      );
  
      if (!updatedTracker) {
        return res.status(404).json({ message: "Tracker not found" });
      }
  
      res.status(200).json(updatedTracker);
    } catch (error) {
      console.error("Error updating tracker:", error);
      res.status(400).json({ message: "Error updating tracker", error: error.message });
    }
    
    /*     console.log("File received:", req.file);
    console.log("Body received:", req.body);
    try {
      const { id } = req.params;
  
      // Parse `recipient` if it's a string
      const updateData = { ...req.body };
      if (typeof updateData.recipient === 'string') {
        updateData.recipient = JSON.parse(updateData.recipient);
      }
  
      const updatedTracker = await CommTrackers.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });
  
      if (!updatedTracker) {
        return res.status(404).json({ message: 'Tracker not found' });
      }
  
      res.status(200).json(updatedTracker);
    } catch (error) {
      logger.error('Error updating tracker', { error: error.message });
      res.status(400).json({ message: 'Error updating tracker', error: error.message });
    } */
  },
  /*
  const updateTrackerById = async (req, res) => {
  try {
    const { id } = req.params;

    const updateData = {
      ...req.body,
      recipient: req.body.recipient ? JSON.parse(req.body.recipient) : undefined,
    };

    if (req.file) {
      updateData.attachment = req.file.buffer;
      updateData.attachmentMimeType = req.file.mimetype;
    }

    const updatedTracker = await CommTrackers.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedTracker) {
      return res.status(404).json({ message: "Tracker not found" });
    }

    res.status(200).json(updatedTracker);
  } catch (error) {
    res.status(400).json({ message: "Error updating tracker", error: error.message });
  }
  },
  */
  
  /*   updateTrackerById: async (req, res) => {
    try {
      const { id } = req.params;

      // Handle file attachment
      const attachment = req.file ? req.file.buffer : undefined;
      const attachmentMimeType = req.file ? req.file.mimetype : undefined;

      const updateData = {
        ...req.body,
        recipient: req.body.recipient ? JSON.parse(req.body.recipient) : undefined,
      };
      if (attachment) {
        updateData.attachment = attachment;
        updateData.attachmentMimeType = attachmentMimeType;
      }

      const updatedTracker = await CommTrackers.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!updatedTracker) {
        return res.status(404).json({ message: 'Tracker not found' });
      }

      res.status(200).json(updatedTracker);
      logger.info('Tracker updated successfully', { trackerId: id });
    } catch (error) {
      logger.error('Error updating tracker', { error: error.message });
      res.status(400).json({ message: 'Error updating tracker', error: error.message });
    }
  },
 */

  // Delete a tracker
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
          return res.status(404).json({ message: "Tracker not found" });
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
    
/*   const getAttachmentWithAuth = async (req, res) => {
    try {
      const { id } = req.params;
  
      // Validate the tracker and its attachment
      const tracker = await CommTrackers.findById(id);
      if (!tracker || !tracker.attachment) {
        return res.status(404).json({ message: "Attachment not found" });
      }
  
      // Set appropriate content headers
      res.set("Content-Type", tracker.attachmentMimeType);
      res.set("Content-Disposition", `attachment; filename=${tracker.attachmentName || "file"}`);
  
      // Stream the attachment
      res.send(tracker.attachment);
    } catch (error) {
      console.error("Error serving attachment:", error);
      res.status(500).json({ message: "Error serving attachment" });
    }
  }
 */
};

module.exports = commTrackersController;
