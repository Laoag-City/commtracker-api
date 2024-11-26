// File path: controllers/Trackers.js
const express = require('express');
const mongoose = require('mongoose');
const CommTrackers = require('../models/Tracker'); // Update path as per your project structure

// Controller
const commTrackersController = {
  // Create a new communication tracker
  createTracker: async (req, res) => {
    try {
      const tracker = new CommTrackers(req.body);
      const savedTracker = await tracker.save();
      res.status(201).json(savedTracker);
    } catch (error) {
      res.status(400).json({ message: 'Error creating tracker', error });
    }
  },

  // Get all communication trackers
  getAllTrackers: async (req, res) => {
    try {
      const trackers = await CommTrackers.find().populate('recipient.receivingDepartment');
      res.status(200).json(trackers);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving trackers', error });
    }
  },

  // Get a specific communication tracker by ID
  getTrackerById: async (req, res) => {
    try {
      const { id } = req.params;
      const tracker = await CommTrackers.findById(id).populate('recipient.receivingDepartment');
      if (!tracker) {
        return res.status(404).json({ message: 'Tracker not found' });
      }
      res.status(200).json(tracker);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving tracker', error });
    }
  },

  // Update a communication tracker by ID
  updateTrackerById: async (req, res) => {
    try {
      const { id } = req.params;
      const updatedTracker = await CommTrackers.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!updatedTracker) {
        return res.status(404).json({ message: 'Tracker not found' });
      }
      res.status(200).json(updatedTracker);
    } catch (error) {
      res.status(400).json({ message: 'Error updating tracker', error });
    }
  },

  // Delete a communication tracker by ID
  deleteTrackerById: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedTracker = await CommTrackers.findByIdAndDelete(id);
      if (!deletedTracker) {
        return res.status(404).json({ message: 'Tracker not found' });
      }
      res.status(200).json({ message: 'Tracker deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting tracker', error });
    }
  },
};

// Export the controller
module.exports = commTrackersController;
// -----------------------------
/* const Tracker = require('../models/Tracker');
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
  try {s
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const skip = (page - 1) * limit;

    const sortBy = req.query.sortBy || 'dateApplied'; // Default sorting field
    const order = req.query.order === 'asc' ? 1 : -1; // Sort order: 'asc' for ascending, default 'desc'
    
    const totalTrackers = await Tracker.countDocuments();
    const trackers = await Tracker.find()
      .populate('recipient.signatory')
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
 */