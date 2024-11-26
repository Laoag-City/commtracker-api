// File path: controllers/Trackers.js
//const express = require('express');
//const mongoose = require('mongoose');
const CommTrackers = require('../models/Tracker'); // Update path as per your project structure
const logger = require('../utils/logger');
// Controller
const commTrackersController = {
  // Create a new tracker
  createTracker: async (req, res) => {
    try {
      const { fromName, documentTitle, recipient } = req.body;

      // Handle file attachment
      const attachment = req.file ? req.file.buffer : null;

      const tracker = new CommTrackers({
        fromName,
        documentTitle,
        recipient,
        attachment, // Store the file as a Buffer
      });

      const savedTracker = await tracker.save();
      res.status(201).json(savedTracker);
      logger.info('Tracker document created successfully', { trackerId: tracker._id });
    } catch (error) {
      logger.error('Error creating Tracker document', { error: error.message });
      res.status(400).json({ message: 'Error creating tracker', error });
    }
  },
/*
    // Get all communication trackers with pagination (WIP)
  getAllTrackers: async (req, res) => {
    try {
      const trackers = await CommTrackers.find().populate('recipient.receivingDepartment');
      res.status(200).json(trackers);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving trackers', error });
    }
  },
  */

  getAllTrackers: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 25;
      const skip = (page - 1) * limit;
  
      const sortBy = req.query.sortBy || 'dateReceived'; // Default sorting field
      const order = req.query.order === 'asc' ? 1 : -1; // Sort order: 'asc' for ascending, default 'desc'
      
      const totalTrackers = await CommTrackers.countDocuments();
      const trackers = await CommTrackers.find()
        .populate('recipient.receivingDepartment')
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
      logger.info('Trackers fetched successfully', { totalTrackers });
    } catch (error) {
      logger.error('Error fetching trackers', { error: error.message });
      res.status(500).json({ message: 'Error fetching trackers', error: error.message });
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
      logger.info('Tracker document ID fetched successfully', { trackerId: tracker._id });
    } catch (error) {
      logger.error('Error fetching Tracker document ID', { error: error.message });
      res.status(500).json({ message: 'Error retrieving tracker', error });
    }
  },
  
  // Update a tracker
  updateTrackerById: async (req, res) => {
    try {
      const { id } = req.params;

      // Handle file attachment
      const attachment = req.file ? req.file.buffer : undefined;

      const updateData = { ...req.body };
      if (attachment) updateData.attachment = attachment; // Only update attachment if provided

      const updatedTracker = await CommTrackers.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!updatedTracker) {
        logger.error('Error updating tracker document', { error: error.message });
        return res.status(404).json({ message: 'Tracker not found' });
      }
      res.status(200).json(updatedTracker);
      logger.info('Tracker document updated successfully', { trackerId: tracker._id });
    } catch (error) {
      logger.error('Error updating tracker document', { error: error.message });
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
      logger.info('OSCP Tracker deleted successfully', { trackerId: tracker._id });
    } catch (error) {
      logger.error('Error deleting OSCP tracker document', { error: error.message });
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
  try {
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