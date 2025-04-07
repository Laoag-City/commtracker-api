import { useState, useEffect } from "react";
import { Container, Form, Button, Alert, Spinner, Table } from "react-bootstrap";
import axios from "axios";
import { useParams } from "react-router-dom";

function DTSStatus() {
  const [trackerIdForm, setTrackerIdForm] = useState("");
  const { id: trackerId } = useParams(); // Extract trackerId from URL
  const [error, setError] = useState("");
  const [trackerData, setTrackerData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Validate MongoDB ObjectId
  const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id);

  const fetchStatus = async (id) => {
    try {
      setLoading(true);
      setError("");
      setTrackerData(null);

      // Make API call to fetch status if the trackerId is valid
      if (isValidObjectId(id)) {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/trackers/status/${id}`
        );
        setTrackerData(response.data);
      } else {
        setError("Invalid/Non-existent/Archived Document Tracking ID.");
      }
    } catch (err) {
      setError("Failed to fetch status. Please check the Tracker ID or try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValidObjectId(trackerIdForm)) {
      fetchStatus(trackerIdForm);
    } else {
      setError("Invalid/Non-existent/Archived Document Tracking ID.");
    }
  };

  useEffect(() => {
    if (trackerId) {
      fetchStatus(trackerId); // Fetch status when trackerId is available in the URL
    }
  }, [trackerId]);

  return (
    <Container className="py-3 text-center">
      <div className="display-6">Laoag City Internal Communication Tracking System</div>
      {/* Conditionally render the input form if no trackerId is provided in the URL */}
      {!trackerId && (
        <Form onSubmit={handleSubmit} className="mt-3">
          <Form.Group controlId="trackerIdInput" className="mb-3">
            <Form.Label>Enter Tracker ID</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter a valid MongoDB ObjectId"
              value={trackerIdForm}
              onChange={(e) => setTrackerIdForm(e.target.value)}
              isInvalid={!!error}
            />
            <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
          </Form.Group>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : "Check Status"}
          </Button>
        </Form>
      )}

      {/* Display tracker data */}
      {trackerData && (
        <div className="mt-4">
          <h5>Document Details</h5>
          <Table bordered hover>
            <tbody>
              <tr>
                <th>Title</th>
                <td>{trackerData.documentTitle}</td>
              </tr>
              <tr>
                <th>Date Received</th>
                <td>{new Date(trackerData.dateReceived).toLocaleDateString()}</td>
              </tr>
            </tbody>
          </Table>
          <h5>Actions</h5>
          <Table bordered hover>
            <thead>
              <tr>
                <th>Receiving Department/Division</th>
                <th>Status</th>
                <th>Remarks</th>
                <th>Date Received</th>
              </tr>
            </thead>
            <tbody>
              {trackerData.recipient.map((rec) => (
                <tr key={rec._id}>
                  <td>{rec.receivingDepartment?.deptName || "Unknown Department"}</td>
                  <td>{rec.status || "Unknown"}</td>
                  <td>{rec.remarks || "No Remarks"}</td>
                  <td>
                    {rec.receiveDate
                      ? new Date(rec.receiveDate).toLocaleDateString()
                      : "Not Received Yet"}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {error && (
        <Alert variant="danger" className="mt-3">
          {error}
        </Alert>
      )}
    </Container>
  );
}

export default DTSStatus;
