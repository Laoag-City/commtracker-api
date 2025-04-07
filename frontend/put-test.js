const request = require('supertest');
const app = require('../app'); // Import your Express app
const mongoose = require('mongoose');
const fs = require('fs');

describe('PUT /api/trackers/:id', () => {
  let token;
  let trackerId;

  beforeAll(async () => {
    // Generate token and create a tracker for testing
    token = "your_generated_token";
    const tracker = await new Tracker({ 
      fromName: "Test Name", 
      documentTitle: "Test Title", 
      dateReceived: "2024-11-27", 
      recipient: [] 
    }).save();
    trackerId = tracker._id;
  });

  afterAll(async () => {
    // Clean up test tracker
    await Tracker.deleteOne({ _id: trackerId });
    mongoose.connection.close();
  });

  it('should update a tracker with valid data', async () => {
    const filePath = `${__dirname}/test-file.pdf`;

    const res = await request(app)
      .put(`/api/trackers/${trackerId}`)
      .set('Authorization', `Bearer ${token}`)
      .field('fromName', 'Updated Name')
      .field('documentTitle', 'Updated Title')
      .field('dateReceived', '2024-11-27')
      .field(
        'recipient',
        JSON.stringify([{ receivingDepartment: "department_id", receiveDate: "2024-11-27", remarks: "", status: "pending" }])
      )
      .attach('attachment', filePath);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('fromName', 'Updated Name');
    expect(res.body).toHaveProperty('documentTitle', 'Updated Title');
    expect(res.body).toHaveProperty('attachment');
  });
});
