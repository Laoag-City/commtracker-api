// File: src/components/DTSReceivingDashboard.jsx

import { useState, useEffect, useCallback } from "react";
import { Table, Button, Modal, Form, Spinner, Alert, Pagination } from "react-bootstrap";
import { QRCodeSVG } from "qrcode.react";
import RenderPdfFirstPage from "./RenderPDFFirstPage";
import { getLoginName, getUserRole } from "../utils/authUtils";
import { fetchData } from "../utils/api";
import axios from "axios";
import { formatDate } from '../utils/date';

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
    username: userName
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
    //console.log(token);
    try {
      const response = await fetchData(
        `${import.meta.env.VITE_API_URL}/trackers?page=${currentPage}&limit=${trackersPerPage}&search=${searchQuery}`,
        token
      );
      setTrackers(response.trackers || [])
      {/* 
        console.log(response.trackers);
      */}
      setTotalPages(response.metadata?.totalPages || 1)
    } catch (error) {
      setError("Failed to fetch trackers: " + error.message)
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchQuery, trackersPerPage, token])

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchData(`${import.meta.env.VITE_API_URL}/departments`, token);
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
      const data = await fetchData(`${import.meta.env.VITE_API_URL}/groups`, token);
      setGroups(data || []);
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
  }, [fetchTrackers, fetchDepartments, fetchGroups]);

  useEffect(() => {
    if (qrTracker?.attachment?.data) {
      const binary = new Uint8Array(qrTracker.attachment.data).reduce(
        (acc, byte) => acc + String.fromCharCode(byte),
        ""
      );
      const base64 = btoa(binary);
      setBase64Attachment(base64);
    } else {
      setBase64Attachment(null);
    }
  }, [qrTracker]);

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
    console.log("Tracker before submission:", currentTracker);
    // Validate required fields
    if (!currentTracker.fromName || !currentTracker.documentTitle || !currentTracker.dateReceived) {
      setError("All fields are required.");
      return;
    }

    if (currentTracker.recipient.length === 0) {
      setError("At least one recipient must be selected.");
      return;
    }
    //if (currentTracker.attachment && currentTracker.attachment.size > 50 * 1024 * 1024) {
    if (currentTracker.attachment && currentTracker.attachment.size > 52428800) {
      setError("File size must not exceed 50MB.");
      return;
    }

    // Create a FormData object
    const formData = new FormData();
    formData.append("fromName", currentTracker.fromName);
    formData.append("documentTitle", currentTracker.documentTitle);
    formData.append("dateReceived", currentTracker.dateReceived);
    formData.append("recipient", JSON.stringify(currentTracker.recipient));

    if (currentTracker.attachment) {
      formData.append("attachment", currentTracker.attachment);
      //console.log("Attachment added to FormData:", currentTracker.attachment.name);
    } else {
      console.log("No attachment provided.");
    }

    const method = modalType === "create" ? "post" : "put";
    const url =
      modalType === "create"
        ? `${import.meta.env.VITE_API_URL}/trackers/new`
        : `${import.meta.env.VITE_API_URL}/trackers/${currentTracker._id}`;

    try {
      // Send the request
      //for some reason new doesn't seem to like formData
      // hacky below
      if (modalType === "create") {
        await axios({
          method,
          url,
          data: currentTracker,
          headers: {
            ...authHeaders.headers,
            "Content-Type": "multipart/form-data",
          },
        })
      } else {
        await axios({
          method,
          url,
          data: formData,
          headers: {
            ...authHeaders.headers,
            "Content-Type": "multipart/form-data",
          },
        })
      };
      setShowModal(false);
      fetchTrackers();
    } catch (error) {
      setError(
        error.response?.data?.errors
          ?.map((err) => err.msg)
          .join(", ") || "Failed to save tracker."
      );
      console.log(JSON.stringify(currentTracker.recipient));
      console.log(formData);
      console.error("Error saving tracker:", error.response || error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this tracker?")) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/trackers/${id}`, authHeaders);
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
                        {/*console.log(rec.receivingDepartment.deptName)*/}
                        {/*console.log(rec)*/}
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
                            `${import.meta.env.VITE_API_URL}/trackers/${tracker._id}/attachment`,
                            {
                              headers: { Authorization: `Bearer ${token}` },
                              responseType: "blob", // Important for file downloads
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
                    {userRole === "trackerreceiving" ? <Button
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
      {/* New Tracker Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalType === "create" ? "Add Tracker" : "Edit Tracker"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>From Name</Form.Label>
              <Form.Control
                type="text"
                value={currentTracker.fromName}
                onChange={(e) =>
                  setCurrentTracker({ ...currentTracker, fromName: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Document Title</Form.Label>
              <Form.Control
                type="text"
                value={currentTracker.documentTitle}
                onChange={(e) =>
                  setCurrentTracker({
                    ...currentTracker,
                    documentTitle: e.target.value,
                  })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Date Received</Form.Label>
              <Form.Control
                type="date"
                value={currentTracker.dateReceived ? new Date(currentTracker.dateReceived).toISOString().split('T')[0] : ""}
                onChange={(e) =>
                  setCurrentTracker({
                    ...currentTracker,
                    dateReceived: e.target.value,
                  })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Recipients</Form.Label>
              <Form.Control
                as="select"
                multiple
                onChange={(e) => {
                  const selectedGroupIds = Array.from(
                    e.target.selectedOptions,
                    (option) => option.value
                  );
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

                  const uniqueRecipients = Array.from(
                    new Map(
                      selectedRecipients.map((r) => [r.receivingDepartment, r])
                    ).values()
                  );

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
            <Form.Group className="mb-3">
              <Form.Label>Attachment (PDF or Image, max 10MB)</Form.Label>
              <Form.Control
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file && file.size > 10 * 1024 * 1024) {
                    setError("File size must not exceed 10MB.");
                  } else {
                    setCurrentTracker({
                      ...currentTracker,
                      attachment: file,
                    });
                  }
                }}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
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
              {qrTracker.attachmentMimeType?.startsWith("image/") ? (
                <div style={{ position: "relative" }}>
                  <img
                    src={`data:${qrTracker.attachmentMimeType};base64,${base64Attachment}`}
                    alt="Attachment"
                    style={{
                      width: "100%",
                      maxHeight: "400px",
                      objectFit: "contain",
                      marginBottom: "20px",
                    }}
                  />
                  {/* Include QR Code Inside the Image Container */}
                  <div
                    style={{
                      textAlign: "center",
                      marginTop: "10px",
                      position: "absolute",
                      bottom: "32px",
                      right: "32px",
                      zIndex: 10
                    }}
                  >
                    <QRCodeSVG
                      value={`${import.meta.env.VITE_API_URL}/trackers/${qrTracker._id}`}
                      size={128}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="H"
                    />
                  </div>
                </div>
              ) : qrTracker.attachmentMimeType === "application/pdf" ? (
                <div>
                  {/*
                  <embed
                    src={`data:application/pdf;base64,${base64Attachment}`}
                    type="application/pdf"
                    style={{
                      width: "100%",
                      height: "400px",
                      border: "none",
                      marginBottom: "20px",
                    }}
                  /> */}
                  <RenderPdfFirstPage base64Pdf={`${base64Attachment}`} />
                  <div
                    style={{
                      textAlign: "center",
                      position: "absolute",
                      bottom: "32px",
                      right: "32px",
                      zIndex: 10
                    }}
                  >
                    <QRCodeSVG
                      value={`${import.meta.env.VITE_API_URL}/trackers/${qrTracker._id}`}
                      size={128}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="H"
                    />
                  </div>
                </div>
              ) : (
                <p>No valid attachment preview available.</p>
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
