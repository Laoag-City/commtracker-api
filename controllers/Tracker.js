// File path: controllers/Trackers.js
const CommTrackers = require('../models/Tracker');
const logger = require('../utils/logger');

const commTrackersController = {
  // Create a new tracker
  createTracker: async (req, res) => {
    try {
      const { fromName, documentTitle, dateReceived, recipient } = req.body;

      // Validate required fields
      if (!fromName || !documentTitle || !dateReceived) {
        return res.status(400).json({ message: 'Required fields are missing' });
      }

      // Handle file attachment
      const attachment = req.file ? req.file.buffer : null;
      const attachmentMimeType = req.file ? req.file.mimetype : null;

      const tracker = new CommTrackers({
        fromName,
        documentTitle,
        dateReceived,
        recipient, //JSON.parse(recipient), Parse recipient array
        attachment,
        attachmentMimeType,
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
  
      // Set the content type based on the stored MIME type
      res.set('Content-Type', tracker.attachmentMimeType);
  
      // Send the binary attachment data
      res.send(tracker.attachment);
    } catch (error) {
      logger.error('Error fetching attachment', { error: error.message });
      res.status(500).json({ message: 'Error fetching attachment', error: error.message });
    }
  },
  
};

module.exports = commTrackersController;

/* //const express = require('express');
//const mongoose = require('mongoose');
const CommTrackers = require('../models/Tracker'); // Update path as per your project structure
const logger = require('../utils/logger');
// Controller
const commTrackersController = {
  // Create a new tracker
  createTracker: async (req, res) => {
    try {
      const { fromName, documentTitle, dateReceived, isArchived, recipient } = req.body;

      // Handle file attachment
      const attachment = req.file ? req.file.buffer : null;

      const tracker = new CommTrackers({
        fromName,
        documentTitle,
        dateReceived,
        isArchived,
        attachment,
        recipient,
      });

      const savedTracker = await tracker.save();
      res.status(201).json(savedTracker);
      logger.info('Tracker document created successfully', { trackerId: tracker._id });
    } catch (error) {
      logger.error('Error creating Tracker document', { error: error.message });
      res.status(400).json({ message: 'Error creating tracker', error });
    }
  },
  
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
      logger.info('Tracker document ID fetched successfully', { trackerId: id });
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
      logger.info('Tracker document updated successfully', { trackerId: id });
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
      logger.info('Tracker deleted successfully', { trackerId: id });
    } catch (error) {
      logger.error('Error deleting Tracker  document', { error: error.message });
      res.status(500).json({ message: 'Error deleting tracker', error });
    }
  },
};

// Export the controller
module.exports = commTrackersController;
 */