const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middlewares/authMiddleware');
const Tracker = require('../models/Tracker'); // Import the Tracker model

// Generate a summary report
router.get('/summary', authenticateJWT, async (req, res) => {
  try {
    // Fetch all trackers
    const trackers = await Tracker.find().populate('recipient.receivingDepartment');

    // Current date for comparison
    const now = new Date();

    // Group data by receivingDepartment
    const departmentSummary = {};

    trackers.forEach(tracker => {
      tracker.recipient.forEach(recipient => {
        const departmentName = recipient.receivingDepartment?.deptName || 'Unknown Department';

        if (!departmentSummary[departmentName]) {
          departmentSummary[departmentName] = {
            total: 0,
            unseen: 0,
            unseenMoreThanDay: 0,
            statuses: {},
          };
        }

        // Increment total trackers for the department
        departmentSummary[departmentName].total++;

        // Increment unseen trackers
        if (!recipient.isSeen) {
          departmentSummary[departmentName].unseen++;
        }

        // Increment unseen for more than a day
        if (!recipient.isSeen && recipient.receiveDate && (now - new Date(recipient.receiveDate)) > 24 * 60 * 60 * 1000) {
          departmentSummary[departmentName].unseenMoreThanDay++;
        }

        // Increment status counts
        const status = recipient.status || 'unknown';
        departmentSummary[departmentName].statuses[status] = (departmentSummary[departmentName].statuses[status] || 0) + 1;
      });
    });

    // Prepare the report
    const report = {
      totalTrackers: trackers.length,
      departmentSummary,
    };

    res.status(200).json({
      message: 'Summary report generated successfully',
      report,
    });
  } catch (error) {
    console.error('Error generating report:', error.message);
    res.status(500).json({ message: 'Error generating report' });
  }
});

module.exports = router;

/**
 * 
 * const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middlewares/authMiddleware');
const Tracker = require('../models/Tracker'); // Import the Tracker model

// Generate a summary report
router.get('/summary', authenticateJWT, async (req, res) => {
  try {
    // Fetch all trackers
    const trackers = await Tracker.find();

    // Current date for comparison
    const now = new Date();

    // Calculate unseen trackers and those unseen for more than a day
    const unseen = trackers.filter(tracker =>
      tracker.recipient.some(recipient => !recipient.isSeen)
    );

    const unseenMoreThanDay = trackers.filter(tracker =>
      tracker.recipient.some(recipient => {
        const receiveDate = recipient.receiveDate;
        return !recipient.isSeen && receiveDate && (now - new Date(receiveDate)) > 24 * 60 * 60 * 1000; // More than 1 day
      })
    );

    // Calculate statuses
    const statuses = trackers.reduce((acc, tracker) => {
      tracker.recipient.forEach(recipient => {
        acc[recipient.status] = (acc[recipient.status] || 0) + 1;
      });
      return acc;
    }, {});

    // Prepare the report
    const report = {
      totalTrackers: trackers.length,
      unseen: unseen.length,
      unseenMoreThanDay: unseenMoreThanDay.length,
      statuses,
    };

    res.status(200).json({
      message: 'Summary report generated successfully',
      report,
    });
  } catch (error) {
    console.error('Error generating report:', error.message);
    res.status(500).json({ message: 'Error generating report' });
  }
});

module.exports = router;
 */