// File: src/components/DTSReceivingDashboard.jsx

import { useState, useEffect, useCallback } from "react";
import { Table, Button, Modal, Form, Spinner, Alert, Pagination } from "react-bootstrap";
import { QRCodeSVG } from "qrcode.react";
//import RenderPdfFirstPage from "./RenderPDFFirstPage";
import { getLoginName, getUserRole } from "../utils/authUtils";
import { fetchData } from "../utils/api";
import axios from "axios";
import { formatDate } from '../utils/date';
import { meta } from "@eslint/js";

const API_URL = import.meta.env.MODE === "production"
  ? import.meta.env.VITE_API_URL_PROD
  : import.meta.env.VITE_API_URL_DEV;

function DTSReceivingDashboard() {


  const [trackers, setTrackers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [trackersPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("create");
  //const API_ENDPOINT = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");
  const userName = getLoginName(); //needed for audit trail
  const userRole = getUserRole();

  const [currentTracker, setCurrentTracker] = useState({
    fromName: "",
    documentTitle: "",
    dateReceived: new Date().toISOString().split('T')[0],
    recipient: [],
    attachment: null,
    attachmentMimeType: null,
    username: userName,
    file: null,
  });


  const [showQRModal, setShowQRModal] = useState(false);
  const [qrTracker, setQRTracker] = useState(null);
  const [base64Attachment, setBase64Attachment] = useState(null);

  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const fetchTrackers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchData(
        `${API_URL}/trackers?page=${currentPage}&limit=${trackersPerPage}&search=${searchQuery}`,
        token
      );
      setTrackers(response.trackers || [])
      //console.log(response.trackers);
      setTotalPages(response.metadata?.totalPages || 1)
    } catch (error) {
      setError("Failed to fetch trackers: " + error.message)
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchQuery, trackersPerPage, token])

  const fetchAttachment = useCallback(async () => {
    if (currentTracker.attachment) {
      //console.log("Fetching attachment:", currentTracker.attachment);
      try {
        const response = await axios.get(
          `${API_URL}/trackers/files/${currentTracker.attachment}`,
          {
            responseType: "arraybuffer",
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const base64String = btoa(
          String.fromCharCode(...new Uint8Array(response.data))
        );
        setBase64Attachment(`data:${currentTracker.attachmentMimeType};base64,${base64String}`);
      } catch (error) {
        console.error("Error fetching attachment:", error);
        setBase64Attachment(null);
      }
    } else {
      setBase64Attachment(null);
    }
  }, [currentTracker.attachment, currentTracker.attachmentMimeType, token]); // Removed `base64Attachment` dependency

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchData(`${API_URL}/departments`, token);
      setDepartments(data || []);
    } catch (error) {
      setError("Error fetching departments: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchData(`${API_URL}/groups`, token);
      const filteredData = (data || []).filter(group => group._id !== "67452fe864bea80431549c62");
      setGroups(filteredData);
      //setGroups(data || []);
    } catch (error) {
      setError("Error fetching groups: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTrackers();
    fetchDepartments();
    fetchGroups();
    //fetchAttachment();
  }, [fetchTrackers, fetchDepartments, fetchGroups]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const openQRModal = (tracker) => {
    setQRTracker(tracker);
    setShowQRModal(true);
  };

  const printAttachment = () => {
    const printContent = document.getElementById("printable-area");
    const printWindow = window.open("", "_blank");

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Attachment</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              text-align: center;
            }
            img, embed {
              max-width: 100%;
              height: auto;
            }
            .qr-code {
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleSave = async () => {

    if (!currentTracker.fromName || !currentTracker.documentTitle || !currentTracker.dateReceived) {
      setError("All fields are required.");
      return;
    }

    if (!Array.isArray(currentTracker.recipient) || currentTracker.recipient.length === 0) {
      setError("At least one recipient must be selected.");
      return;
    }

    console.log("Tracker before submission:", currentTracker);
    // ✅ Debug: Check if recipient list exists before appending to FormData
    //console.log("Recipients Before FormData:", JSON.stringify(currentTracker.recipient, null, 2));
    const formData = new FormData();

    formData.append("fromName", currentTracker.fromName);
    formData.append("documentTitle", currentTracker.documentTitle);
    formData.append("dateReceived", currentTracker.dateReceived);

    //formData.append("recipient", currentTracker.recipient);

    // ✅ Append recipients correctly
    currentTracker.recipient.forEach((rec, index) => {
      console.log(rec.receivingDepartment, index);
      formData.append(`recipient[${index}][receiveDate]`, rec.receiveDate);
      formData.append(`recipient[${index}][receivingDepartment]`, rec.receivingDepartment);
      formData.append(`recipient[${index}][status]`, rec.status);
      formData.append(`recipient[${index}][remarks]`, rec.remarks);
    });

    formData.append("attachmentMimeType", currentTracker.file.type);
    formData.append("file", currentTracker.file);

    // ✅ Debugging: Log the entire FormData before sending
    //console.log("FormData Before Sending:");
    //for (const pair of formData.entries()) {
    //  console.log(`FormData Key: ${pair[0]}, Value:`, pair[1]);
    // }

    //for (const pair of formData.entries()) {
    //  console.log(`FormData Key: ${pair[0]}, Value:`, pair[1]);
    //}

    // try {
    //   const response = await axios.post("http://localhost:3004/trackers/new", data, {
    //     headers: {
    //       Authorization:
    //         "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NzkxOTdiMjUwNGRmNWIwYTk2NWE3YTkiLCJ1c2VybmFtZSI6ImR0c3N1cGVyYWRtaW4iLCJkZXB0SWQiOnsiX2lkIjoiNjczZTg2YmUzMjA2M2E1Y2QzNDEyN2RiIiwiZGVwdENvZGUiOjEwMDEsImRlcHROYW1lIjoiU3VwZXJhZG1pbiBEZXBhcnRtZW50IiwiY3JlYXRlZEF0IjoiMjAyNC0xMS0yMVQwMTowMjo1NC44NzhaIiwidXBkYXRlZEF0IjoiMjAyNC0xMS0yMVQwMTowMjo1NC44NzhaIiwiX192IjowfSwidXNlcnJvbGUiOiJzdXBlcmFkbWluIiwiaWF0IjoxNzQwMDM1Njg2LCJleHAiOjE3NDAxMjIwODZ9.j9AZZ8g8vCdd5YxLDcR0FE-sbswJjuBThFboCrXerfU",
    //       "Content-Type": "multipart/form-data",
    //     },
    //   });
    try {
      //console.log(modalType);
      await axios({
        method: modalType === "create" ? "post" : "put",
        url: modalType === "create"
          ? `${API_URL}/trackers/new`
          : `${API_URL}/trackers/${currentTracker._id}`,
        data: modalType === "create" ? formData : formData,
        headers: {
          ...authHeaders.headers,
          "Content-Type": "multipart/form-data",
        },
      });

      setShowModal(false);
      fetchTrackers(); // Refresh the list after saving
    } catch (error) {
      console.error("Error saving tracker:", error.response?.data || error);
      setError(error.response?.data?.message || "Failed to save tracker.");
    }
  };

  // delete relegated to superadmin account
  /*   const mockTracker = {
      fromName: "John Doe",
      documentTitle: "Project Proposal",
      dateReceived: "2025-02-20",
      recipient: [
        { receivingDepartment: "67455430adccd9e38fe50774", status: "pending", remarks: "Urgent review needed" },
        { receivingDepartment: "67455437adccd9e38fe5077a", status: "pending", remarks: "For discussion" },
        { receivingDepartment: "67455440adccd9e38fe50780", status: "pending", remarks: "Approval required" }
      ],
      attachment: new File(["Mock file content"], "mock-document.pdf", { type: "application/pdf" })
    }; */

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this tracker?")) return;

    try {
      await axios.delete(`${API_URL}/trackers/${id}`, authHeaders);
      fetchTrackers();
    } catch (error) {
      setError("Failed to delete tracker: " + error.message);
    }
  };


  const openModal = (type, tracker = null) => {
    setModalType(type);
    setCurrentTracker(
      tracker || {
        fromName: "",
        documentTitle: "",
        dateReceived: "",
        recipient: [],
        attachment: null,
        username: userName
      }
    );
    setShowModal(true);
  };

  return (
    <div className="p-4">
      <div className="display-6">Laoag City Internal Communication Tracking System</div>
      <h2>Document Tracker Management</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {userRole === "trackerreceiving" ?
        <Button onClick={() => openModal("create")} className="mb-3">
          New
        </Button>
        : " "
      }
      {loading ? (
        <Spinner animation="border" />
      ) : (
        <>
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
                  {/*console.log(tracker)*/}
                  <td>
                    {tracker.recipient.map((rec, idx) => (
                      <div key={idx}>
                        {rec.receivingDepartment?.deptName ? (
                          rec.receivingDepartment.deptName
                        ) : (
                          <span className="text-red-500">Error: Department Name Mismatch</span>
                        )}
                      </div>
                    ))}
                  </td>
                  <td>
                    <Button
                      size="sm"
                      onClick={() => openQRModal(tracker)}
                    >
                      View QR
                    </Button>
                  </td>
                  <td>
                    {tracker.attachment ? (
                      <Button
                        variant="link"
                        onClick={async () => {
                          const token = localStorage.getItem("token");
                          const response = await axios.get(
                            `${API_URL}/trackers/files/${tracker.attachment}`,
                            {
                              headers: { Authorization: `Bearer ${token}` },
                              responseType: "blob",
                            }
                          );
                          const url = window.URL.createObjectURL(new Blob([response.data]));
                          const link = document.createElement("a");
                          const extension = tracker.attachmentMimeType.toString().split('/')[1];
                          const filename = "dts-" + formatDate(tracker.dateReceived) + "." + extension;
                          link.href = url;
                          link.setAttribute("download", tracker.attachmentName || filename);
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                        }}
                      >
                        Download
                      </Button>
                    ) : (
                      "No Attachment"
                    )}
                  </td>
                  <td>
                    <Button
                      size="sm"
                      variant="info"
                      onClick={() => openModal("update", tracker)}
                    >
                      Edit
                    </Button>{" "}
                    {userRole === "dtssuperadmin" ? <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(tracker._id)}
                    >
                      Delete
                    </Button>
                      : " "}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <Pagination className="justify-content-center">
            <Pagination.Prev
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            />
            {[...Array(totalPages).keys()].map((page) => (
              <Pagination.Item
                key={page + 1}
                active={page + 1 === currentPage}
                onClick={() => handlePageChange(page + 1)}
              >
                {page + 1}
              </Pagination.Item>
            ))}
            <Pagination.Next
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            />
          </Pagination>
        </>
      )
      }
      {/* New Tracker Modal*/}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalType === "create" ? "Add Tracker" : "Edit Tracker"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {/* From Name (Required) */}
            <Form.Group className="mb-3">
              <Form.Label>From Name</Form.Label>
              <Form.Control
                type="text"
                value={currentTracker.fromName}
                required
                onBlur={() => {
                  if (!currentTracker.fromName) setError("From Name is required.");
                }}
                onChange={(e) => {
                  setError(null);
                  setCurrentTracker({ ...currentTracker, fromName: e.target.value });
                }}
              />
            </Form.Group>

            {/* Document Title (Required) */}
            <Form.Group className="mb-3">
              <Form.Label>Document Title</Form.Label>
              <Form.Control
                type="text"
                value={currentTracker.documentTitle}
                required
                onBlur={() => {
                  if (!currentTracker.documentTitle) setError("Document Title is required.");
                }}
                onChange={(e) => {
                  setError(null);
                  setCurrentTracker({
                    ...currentTracker,
                    documentTitle: e.target.value,
                  });
                }}
              />
            </Form.Group>

            {/* Date Received (Required) */}
            <Form.Group className="mb-3">
              <Form.Label>Date Received</Form.Label>
              <Form.Control
                type="date"
                value={currentTracker.dateReceived ? new Date(currentTracker.dateReceived).toISOString().split('T')[0] : ""}
                required
                onBlur={() => {
                  if (!currentTracker.dateReceived) setError("Date Received is required.");
                }}
                onChange={(e) => {
                  setError(null);
                  setCurrentTracker({
                    ...currentTracker,
                    dateReceived: e.target.value,
                  });
                }}
              />
            </Form.Group>

            {/* Recipients (Required) */}
            <Form.Group className="mb-3">
              <Form.Label>Recipients</Form.Label>
              <Form.Control
                as="select"
                multiple
                required
                onBlur={() => {
                  if (!currentTracker.recipient.length) setError("At least one recipient must be selected.");
                }}
                onChange={(e) => {
                  const selectedGroupIds = Array.from(e.target.selectedOptions, (option) => option.value);
                  const selectedRecipients = selectedGroupIds
                    .map((groupId) => groups.find((group) => group._id === groupId))
                    .flatMap((group) =>
                      group?.departmentIds.map((dept) => ({
                        receivingDepartment: dept._id,
                        receiveDate: new Date(),
                        remarks: "",
                        status: "pending",
                      })) || []
                    );

                  const uniqueRecipients = Array.from(new Map(selectedRecipients.map((r) => [r.receivingDepartment, r])).values());

                  if (uniqueRecipients.length === 0) {
                    setError("At least one recipient must be selected.");
                  } else {
                    setError(null);
                  }

                  setCurrentTracker({
                    ...currentTracker,
                    recipient: uniqueRecipients,
                  });
                }}
              >
                {groups.map((group) => (
                  <option key={group._id} value={group._id}>
                    {group.groupName}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>

            {/* Attachment (Required, max 50MB) */}
            <Form.Group className="mb-3">
              <Form.Label>Attachment (PDF or Image, max 50MB)</Form.Label>
              <Form.Control
                type="file"
                accept=".pdf,image/*"
                required
                onBlur={() => {
                  if (!currentTracker.file) setError("An attachment is required.");
                }}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file && file.size > 50 * 1024 * 1024) {
                    setError("File size must not exceed 50MB.");
                  } else {
                    setError(null);
                    setCurrentTracker({
                      ...currentTracker,
                      file: file,
                    });
                  }
                }}
              />
            </Form.Group>

            {/* Submit Button - Disabled if required fields are missing 
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={
                !currentTracker.fromName ||
                !currentTracker.documentTitle ||
                !currentTracker.dateReceived ||
                !currentTracker.recipient.length ||
                !currentTracker.file
              }
            >
              Save
            </Button>*/}

            {/* Display Error Message if Any */}
            {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={
              !currentTracker.fromName ||
              !currentTracker.documentTitle ||
              !currentTracker.dateReceived ||
              !currentTracker.recipient.length ||
              !currentTracker.file
            }
          >
            Save
          </Button>
        </Modal.Footer>
      </Modal>
      {/* QR Modal */}
      <Modal show={showQRModal} onHide={() => setShowQRModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>QR Code with Attachment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {qrTracker && (
            <div
              id="printable-area"
              style={{
                textAlign: "center",
                padding: "20px",
                width: "100%",
                height: "100%",
                border: "none",
                position: "relative"
              }}
            >
              {/* Render Image or PDF */}
              {import.meta.env.MODE === 'production' ? (
                <QRCodeSVG
                  value={`${API_URL}/status/${qrTracker._id}`}
                  size={128}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="H"
                  imageSettings={{
                    src: "/favicon-32x32.png",
                    x: undefined,
                    y: undefined,
                    height: 16,
                    width: 16,
                    opacity: 1,
                    excavate: true,
                  }}
                />
              ) : (
                <QRCodeSVG
                  value={`${API_URL}/status/${qrTracker._id}`}
                  size={128}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="L"  // You can change this to 'L' for lower error correction level in dev
                  imageSettings={{
                    src: "/favicon-32x32.png",
                    x: undefined,
                    y: undefined,
                    height: 16,
                    width: 16,
                    opacity: 1,
                    excavate: true,
                  }}
                />
              )}
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={printAttachment}>Print</Button>
          <Button variant="secondary" onClick={() => setShowQRModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div >
  );
}

export default DTSReceivingDashboard;
