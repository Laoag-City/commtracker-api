const express = require('express');
const router = express.Router();
const Tracker = require('../models/Tracker'); // Assuming you have a Tracker model

// Generate a summary report
router.get('/summary', async (req, res) => {
  try {
    // Fetch all trackers
    const trackers = await Tracker.find();

    // Calculate unseen, seen, and unseen for more than a day
    const now = new Date();
    const unseen = trackers.filter(tracker => tracker.status === 'unseen');
    const seen = trackers.filter(tracker => tracker.status === 'seen');
    const unseenMoreThanDay = trackers.filter(tracker => {
      const createdAt = new Date(tracker.createdAt);
      return tracker.status === 'unseen' && (now - createdAt) > 24 * 60 * 60 * 1000; // More than 1 day
    });

    // Prepare the report
    const report = {
      totalTrackers: trackers.length,
      unseen: unseen.length,
      seen: seen.length,
      unseenMoreThanDay: unseenMoreThanDay.length,
      statuses: trackers.reduce((acc, tracker) => {
        acc[tracker.status] = (acc[tracker.status] || 0) + 1;
        return acc;
      }, {}),
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