const Tracker = require('../models/trackerModel');
const logger = require('../utils/logger');

// Create a new tracker
exports.createTracker = async (req, res) => {
  try {
    const tracker = new Tracker(req.body);
    await tracker.save();
    res.status(201).json(tracker);
    logger.info('OSCP Tracker document created successfully', { trackerId: tracker._id });
  } catch (error) {
    logger.error('Error creating OSCP tracker document', { error: error.message });
    res.status(500).json({ message: 'Error creating OSCP tracker document', error: error.message });
  }
};

// Get all trackers with pagination
exports.getAllTrackers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const skip = (page - 1) * limit;

    const sortBy = req.query.sortBy || 'dateApplied'; // Default sorting field
    const order = req.query.order === 'asc' ? 1 : -1; // Sort order: 'asc' for ascending, default 'desc'
    
    const totalTrackers = await Tracker.countDocuments();
    const trackers = await Tracker.find()
      .populate('constructionPermitSignatories.signatory')
      .sort({ [sortBy]: order }) // Sort by the field in ascending/descending order
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
    logger.info('OSCP Trackers fetched successfully', { totalTrackers });
  } catch (error) {
    logger.error('Error fetching OSCP trackers', { error: error.message });
    res.status(500).json({ message: 'Error fetching OSCP trackers', error: error.message });
  }
};

// Get a tracker by ID
exports.getTrackerById = async (req, res) => {
  try {
    const tracker = await Tracker.findById(req.params.id).populate('constructionPermitSignatories.signatory');
    if (!tracker) {
      return res.status(404).json({ message: 'OSCP Tracker document ID not found' });
    }
    res.status(200).json(tracker);
    logger.info('OSCP Tracker document ID fetched successfully', { trackerId: tracker._id });
  } catch (error) {
    logger.error('Error fetching OSCP tracker document ID', { error: error.message });
    res.status(500).json({ message: 'Error fetching OSCP tracker document ID', error: error.message });
  }
};

// Update a tracker by ID
exports.updateTracker = async (req, res) => {
  try {
    const tracker = await Tracker.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!tracker) {
      return res.status(404).json({ message: 'OSCP Tracker document not found' });
    }
    res.status(200).json(tracker);
    logger.info('OSCP Tracker document updated successfully', { trackerId: tracker._id });
  } catch (error) {
    logger.error('Error updating OSCP tracker document', { error: error.message });
    res.status(500).json({ message: 'Error updating OSCP tracker document', error: error.message });
  }
};

// Delete a tracker by ID
exports.deleteTracker = async (req, res) => {
  try {
    const tracker = await Tracker.findByIdAndDelete(req.params.id);
    if (!tracker) {
      return res.status(404).json({ message: 'OSCP Tracker document ID not found' });
    }
    res.status(200).json({ message: 'OSCP Tracker document deleted successfully' });
    logger.info('OSCP Tracker deleted successfully', { trackerId: tracker._id });
  } catch (error) {
    logger.error('Error deleting OSCP tracker document', { error: error.message });
    res.status(500).json({ message: 'Error deleting OSCP tracker document', error: error.message });
  }
};

/* const Tracker = require('../models/trackerModel');
const logger = require('../utils/logger');

// Create a new tracker
exports.createTracker = async (req, res) => {
  try {
    const tracker = new Tracker(req.body);
    await tracker.save();
    res.status(201).json(tracker);
    logger.info('OSCP Tracker Documment created successfully', { trackerId: tracker._id });
  } catch (error) {
    logger.error('Error creating OSCP tracker document', { error: error.message });
    res.status(500).json({ message: 'Error creating OSCP tracker document', error: error.message });
  }
};

// Get all trackers
exports.getAllTrackers = async (req, res) => {
  try {
    const trackers = await Tracker.find().populate('constructionPermitSignatories.signatory');
    res.status(200).json(trackers);
    logger.info('OSCP Trackers fetched successfully');
  } catch (error) {
    logger.error('Error fetching trackers', { error: error.message });
    res.status(500).json({ message: 'Error fetching OSCP tracker documents', error: error.message });
  }
};

// Get a tracker by ID
exports.getTrackerById = async (req, res) => {
  try {
    const tracker = await Tracker.findById(req.params.id).populate('constructionPermitSignatories.signatory');
    if (!tracker) {
      return res.status(404).json({ message: 'OSCP Tracker document ID not found' });
    }
    res.status(200).json(tracker);
    logger.info('OSCP Tracker document ID fetched successfully', { trackerId: tracker._id });
  } catch (error) {
    logger.error('Error fetching OSCP tracker document ID', { error: error.message });
    res.status(500).json({ message: 'Error fetching tracker', error: error.message });
  }const Tracker = require('../models/trackerModel');
  const logger = require('../utils/logger');
  
  // Create a new tracker
  exports.createTracker = async (req, res) => {
    try {
      const tracker = new Tracker(req.body);
      await tracker.save();
      res.status(201).json(tracker);
      logger.info('OSCP Tracker document created successfully', { trackerId: tracker._id });
    } catch (error) {
      logger.error('Error creating OSCP tracker document', { error: error.message });
      res.status(500).json({ message: 'Error creating tracker', error: error.message });
    }
  };
  
  // Get all trackers
  exports.getAllTrackers = async (req, res) => {
    try {
      const trackers = await Tracker.find().populate('constructionPermitSignatories.signatory');
      res.status(200).json(trackers);
      logger.info('Trackers fetched successfully');
    } catch (error) {
      logger.error('Error fetching trackers', { error: error.message });
      res.status(500).json({ message: 'Error fetching trackers', error: error.message });
    }
  };
  
  // Get a tracker by ID
  exports.getTrackerById = async (req, res) => {
    try {
      const tracker = await Tracker.findById(req.params.id).populate('constructionPermitSignatories.signatory');
      if (!tracker) {
        return res.status(404).json({ message: 'OSCP Tracker document ID not found' });
      }
      res.status(200).json(tracker);
      logger.info('OSCP Tracker document ID fetched successfully', { trackerId: tracker._id });
    } catch (error) {
      logger.error('Error fetching OSCP tracker document ID', { error: error.message });
      res.status(500).json({ message: 'Error fetching OSCP tracker document ID', error: error.message });
    }
  };
  
  // Update a tracker by ID
  exports.updateTracker = async (req, res) => {
    try {
      const tracker = await Tracker.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!tracker) {
        return res.status(404).json({ message: 'OSCP Tracker document not found' });
      }
      res.status(200).json(tracker);
      logger.info('OSCP Tracker document updated successfully', { trackerId: tracker._id });
    } catch (error) {
      logger.error('Error updating OSCP tracker document', { error: error.message });
      res.status(500).json({ message: 'Error updating OSCP tracker document ID', error: error.message });
    }
  };
  
  // Delete a tracker by ID
  exports.deleteTracker = async (req, res) => {
    try {
      const tracker = await Tracker.findByIdAndDelete(req.params.id);
      if (!tracker) {
        return res.status(404).json({ message: 'OSCP Tracker document not found' });
      }
      res.status(200).json({ message: 'OSCP Tracker document deleted successfully' });
      logger.info('OSCP Tracker document deleted successfully', { trackerId: tracker._id });
    } catch (error) {
      logger.error('Error deleting OSCP tracker document', { error: error.message });
      res.status(500).json({ message: 'Error deleting OSCP tracker document', error: error.message });
    }
  };
  
};

// Update a tracker by ID
exports.updateTracker = async (req, res) => {
  try {
    const tracker = await Tracker.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!tracker) {
      return res.status(404).json({ message: 'OSCP Tracker document not found' });
    }
    res.status(200).json(tracker);
    logger.info('OSCP Tracker document updated successfully', { trackerId: tracker._id });
  } catch (error) {
    logger.error('Error updating OSCP tracker document', { error: error.message });
    res.status(500).json({ message: 'Error updating OSCP tracker document', error: error.message });
  }
};

// Delete a tracker by ID
exports.deleteTracker = async (req, res) => {
  try {
    const tracker = await Tracker.findByIdAndDelete(req.params.id);
    if (!tracker) {
      return res.status(404).json({ message: 'OSCP Tracker document ID not found' });
    }
    res.status(200).json({ message: 'OSCP Tracker document deleted successfully' });
    logger.info('OSCP Tracker deleted successfully', { trackerId: tracker._id });
  } catch (error) {
    logger.error('Error deleting tracker', { error: error.message });
    res.status(500).json({ message: 'Error deleting OSCP tracker document', error: error.message });
  }
};
 */