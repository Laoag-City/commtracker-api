// components/TrackerTable.js
//import React from "react";
import PropTypes from "prop-types";
import { Table, Button } from "react-bootstrap";
import { formatDate } from "../utils/date";

function TrackerTable({ trackers, currentPage, trackersPerPage, onEdit, onDelete, onDownload, onQRView }) {
  return (
    <Table striped bordered hover className="text-start">
      <thead>
        <tr>
          <th>#</th>
          <th>From</th>
          <th>Title</th>
          <th>Received On</th>
          <th>Department/s</th>
          <th>Print</th>
          <th>Attachment</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {trackers.map((tracker, index) => (
          <tr key={tracker._id}>
            <td>{(currentPage - 1) * trackersPerPage + index + 1}</td>
            <td>{tracker.fromName}</td>
            <td>{tracker.documentTitle}</td>
            <td>{formatDate(tracker.dateReceived)}</td>
            <td>
              {tracker.recipient.map((rec, idx) => (
                <div key={idx}>{rec.receivingDepartment?.deptName || ""}</div>
              ))}
            </td>
            <td>
              <Button size="sm" onClick={() => onQRView(tracker)}>View QR</Button>
            </td>
            <td>
              {tracker.attachment ? (
                <Button variant="link" onClick={() => onDownload(tracker)}>Download</Button>
              ) : "No Attachment"}
            </td>
            <td>
              <Button size="sm" variant="info" onClick={() => onEdit(tracker)}>Edit</Button>{" "}
              <Button size="sm" variant="danger" onClick={() => onDelete(tracker._id)}>Delete</Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

// Add PropTypes
TrackerTable.propTypes = {
  trackers: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      fromName: PropTypes.string.isRequired,
      documentTitle: PropTypes.string.isRequired,
      dateReceived: PropTypes.string.isRequired,
      attachment: PropTypes.shape({
        data: PropTypes.any, // Adjust based on actual attachment structure
        mimeType: PropTypes.string, // Example field inside the attachment object
      }),
    })
  ).isRequired,
  currentPage: PropTypes.number.isRequired,
  trackersPerPage: PropTypes.number.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onDownload: PropTypes.func.isRequired,
  onQRView: PropTypes.func.isRequired,
};


export default TrackerTable;
