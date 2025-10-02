import { useState, useEffect, useCallback, useMemo, useRef, Component } from "react";
import { Container, Table, Button, Modal, Form, Spinner, Alert, Pagination, InputGroup, FormControl, OverlayTrigger, Tooltip } from "react-bootstrap";
import { QRCodeSVG } from "qrcode.react";
import Draggable from 'react-draggable';
import CustomDualListBox from './CustomDualListBox';
import { getLoginName, getUserRole } from "../utils/authUtils";
import { fetchData } from "../utils/api";
import axios from "axios";
import { formatDate } from '../utils/date';
import { debounce } from 'lodash';
import { PlusCircle, QrCode, Download, PencilSquare, Trash, Printer, XCircle } from 'react-bootstrap-icons';

const API_URL = import.meta.env.MODE === "production"
  ? import.meta.env.VITE_API_URL_PROD
  : import.meta.env.VITE_API_URL_DEV;

import PropTypes from "prop-types";

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    console.error("ErrorBoundary caught:", error);
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div style={{ textAlign: "center", color: "red" }}>Error rendering QR code. Please try again.</div>;
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
};

function DTSReceivingDashboard() {
  const [trackers, setTrackers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [trackersPerPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" });
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("create");
  const token = localStorage.getItem("token");
  const userName = getLoginName();
  const userRole = getUserRole();

  const [currentTracker, setCurrentTracker] = useState({
    fromName: "",
    documentTitle: "",
    dateReceived: new Date().toISOString().split('T')[0],
    lceAction: "approved",
    lceActionKeyedIn: "",
    recipient: [],
    attachment: null,
    attachmentMimeType: null,
    username: userName,
    file: null,
  });

  const [showQRModal, setShowQRModal] = useState(false);
  const [qrTracker, setQRTracker] = useState(null);
  const qrRef = useRef(null);

  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // Create department options for CustomDualListBox, ensuring unique department IDs
  const departmentOptions = useMemo(() => {
    const deptMap = new Map();
    groups
      .filter(group => group.groupName !== "LFC")
      .forEach(group => {
        group.departmentIds.forEach(dept => {
          if (!deptMap.has(dept._id)) {
            deptMap.set(dept._id, {
              value: dept._id,
              label: `${dept.deptName || dept.initial || 'Unknown'}`,
            });
          }
        });
      });
    return Array.from(deptMap.values());
  }, [groups]);

  // Selected department IDs
  const selectedDepartments = useMemo(() => {
    return currentTracker.recipient.map(rec => rec.receivingDepartment);
  }, [currentTracker.recipient]);

  // Fetch functions
  const fetchTrackers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchData(
        `${API_URL}/trackers?page=${currentPage}&limit=${trackersPerPage}&search=${encodeURIComponent(searchQuery)}`,
        token
      );
      setTrackers(response.trackers || []);
      setTotalPages(response.metadata?.totalPages || 1);
    } catch (error) {
      setError("Failed to fetch trackers: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, trackersPerPage, token]);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchData(`${API_URL}/departments`, token);
      setDepartments(data || []);
    } catch (error) {
      setError("Error fetching departments: " + departments + error.message);
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
    } catch (error) {
      setError("Error fetching groups: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const debouncedSearch = useMemo(
    () => debounce((value) => {
      setSearchQuery(value);
      setCurrentPage(1);
    }, 300),
    []
  );

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };

  useEffect(() => {
    fetchTrackers();
    fetchDepartments();
    fetchGroups();
    if (alert.show) {
      const timer = setTimeout(() => {
        setAlert({ show: false, message: "", variant: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [fetchTrackers, fetchDepartments, fetchGroups, alert.show]);

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
            @page { size: A4; margin: 0; }
            body { font-family: Arial, sans-serif; margin: 0; display: flex; justify-content: center; align-items: center; height: 297mm; width: 210mm; }
            .printable-content { text-align: center; max-width: 210mm; max-height: 297mm; padding: 20px; }
            .qr-code { margin-top: 10px; }
            img, svg { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          <div class="printable-content">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  const handleSave = async () => {
    //console.log("Saving tracker:", currentTracker.recipient);
    if (!currentTracker.fromName || !currentTracker.documentTitle || !currentTracker.dateReceived) {
      setError("All fields are required.");
      return;
    }
    if (!Array.isArray(currentTracker.recipient) || currentTracker.recipient.length === 0) {
      setError("At least one recipient department must be selected.");
      return;
    }
    const formData = new FormData();
    formData.append("fromName", currentTracker.fromName);
    formData.append("documentTitle", currentTracker.documentTitle);
    formData.append("dateReceived", currentTracker.dateReceived);
    formData.append("username", currentTracker.username);
    currentTracker.recipient.forEach((rec, index) => {
      formData.append(`recipient[${index}][receiveDate]`, rec.receiveDate);
      formData.append(`recipient[${index}][receivingDepartment]`, rec.receivingDepartment);
      formData.append(`recipient[${index}][status]`, rec.status);
      formData.append(`recipient[${index}][remarks]`, rec.remarks || "");
    });
    if (currentTracker.file) {
      formData.append("file", currentTracker.file);
    }

    //for (let [key, value] of formData.entries()) {
    //  console.log(`FormData: ${key} = ${value instanceof File ? value.name : value}`);
    // }

    try {
      await axios({
        method: modalType === "create" ? "post" : "put",
        url: modalType === "create" ? `${API_URL}/trackers/new` : `${API_URL}/trackers/${currentTracker._id}`,
        data: formData,
        headers: {
          ...authHeaders.headers,
          "Content-Type": "multipart/form-data",
        },
      });
      setAlert({ show: true, message: "Tracker saved successfully!", variant: "success" });
      setShowModal(false);
      fetchTrackers();
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to save tracker.";
      console.error("Save error:", error.response?.data || error);
      setAlert({ show: true, message: errorMessage, variant: "danger" });
      setError(errorMessage);
    }
  };

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
    setError(null); // Clear any existing errors
    if (type === "update" && tracker) {
      setCurrentTracker({
        _id: tracker._id,
        fromName: tracker.fromName || "",
        documentTitle: tracker.documentTitle || "",
        dateReceived: tracker.dateReceived ? new Date(tracker.dateReceived).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        recipient: tracker.recipient.map(rec => ({
          receivingDepartment: rec.receivingDepartment?._id || rec.receivingDepartment,
          receiveDate: rec.receiveDate || new Date().toISOString(),
          status: rec.status || "pending",
          remarks: rec.remarks || "",
        })),
        attachment: tracker.attachment || null,
        attachmentMimeType: tracker.attachmentMimeType || null,
        username: userName,
        file: null, // File is null unless a new file is selected
      });
    } else {
      setCurrentTracker({
        fromName: "",
        documentTitle: "",
        dateReceived: new Date().toISOString().split('T')[0],
        recipient: [],
        attachment: null,
        attachmentMimeType: null,
        username: userName,
        file: null,
      });
    }
    setShowModal(true);
  };

  return (
    <Container fluid className="p-4">
      <h2>Receiving Office ({getLoginName()})</h2>
      {error && (
        <Alert
          variant="danger"
          onClose={() => setError(null)}
          dismissible
        >
          {error}
        </Alert>
      )}
      <div className="d-flex justify-content-between align-items-center mb-3">
        {userRole === "trackerreceiving" && (
          <OverlayTrigger placement="top" overlay={<Tooltip>Add New Tracker</Tooltip>}>
            <Button variant="link" onClick={() => openModal("create")}>
              <PlusCircle size={24} />
            </Button>
          </OverlayTrigger>
        )}
        <InputGroup style={{ maxWidth: "300px" }}>
          <FormControl
            placeholder="Search by document title..."
            onChange={handleSearchChange}
          />
          {loading && <InputGroup.Text><Spinner animation="border" size="sm" /></InputGroup.Text>}
          <Button
            variant="outline-secondary"
            onClick={() => {
              debouncedSearch.cancel();
              setSearchQuery("");
              setCurrentPage(1);
            }}
          >
            Clear
          </Button>
        </InputGroup>
      </div>
      {loading ? (
        <Spinner animation="border" />
      ) : trackers.length === 0 ? (
        <Alert variant="info">No trackers found.</Alert>
      ) : (
        <>
          <Table striped bordered hover className="text-start">
            <thead>
              <tr>
                <th>#</th>
                <th>From</th>
                <th>Title</th>
                <th>ReceiveDate</th>
                <th>Receiving Dept/s-Action-Remarks</th>
                <th><QrCode size={20} /></th>
                <th><Download size={20} /></th>
                <th><PencilSquare size={20} /></th>
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
                      <div key={idx}>
                        {rec.receivingDepartment?.initial || rec.receivingDepartment?.deptName || (
                          <span className="text-red-500">Error: Department Name Mismatch</span>
                        )}
                        {" - "}
                        {rec.status === "pending" ? (<span className="text-warning">Pending</span>) :
                          rec.status === "approved" ? (<span className="text-success">Approved</span>) :
                            rec.status === "rejected" ? (<span className="text-danger">Rejected</span>) :
                              (<span className="text-secondary">Unknown Status</span>)}
                        <span className="text-muted">{rec.remarks ? ` - ${rec.remarks}` : ""}</span>
                        <span className="text-muted">{rec.dateSeen ? ` - ${formatDate(rec.dateSeen)}` : " - N/A"}</span>
                      </div>
                    ))}
                  </td>
                  <td>
                    <OverlayTrigger placement="top" overlay={<Tooltip>View QR Code</Tooltip>}>
                      <Button variant="link" size="sm" onClick={() => openQRModal(tracker)}>
                        <QrCode size={20} />
                      </Button>
                    </OverlayTrigger>
                  </td>
                  <td>
                    {tracker.attachment ? (
                      <OverlayTrigger placement="top" overlay={<Tooltip>Download Attachment</Tooltip>}>
                        <Button
                          variant="link"
                          onClick={async () => {
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
                          <Download size={20} />
                        </Button>
                      </OverlayTrigger>
                    ) : (
                      "No Attachment"
                    )}
                  </td>
                  <td>
                    <OverlayTrigger placement="top" overlay={<Tooltip>Edit Tracker</Tooltip>}>
                      <Button variant="link" size="sm" onClick={() => openModal("update", tracker)}>
                        <PencilSquare size={20} />
                      </Button>
                    </OverlayTrigger>
                    {userRole === "dtssuperadmin" && (
                      <OverlayTrigger placement="top" overlay={<Tooltip>Delete Tracker</Tooltip>}>
                        <Button variant="link" size="sm" onClick={() => handleDelete(tracker._id)}>
                          <Trash size={20} color="red" />
                        </Button>
                      </OverlayTrigger>
                    )}
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
      )}
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
                required
                onBlur={() => {
                  if (!currentTracker.fromName) setError("From Name is required.");
                }}
                onChange={(e) => {
                  setError(null);
                  setCurrentTracker({ ...currentTracker, fromName: e.target.value });
                }}
              />
              <Form.Text className="text-muted">
                Enter the name of the sender or department.
              </Form.Text>
            </Form.Group>
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
              <Form.Text className="text-muted">
                Enter the title or subject of the document.
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Date Received</Form.Label>
              <Form.Control
                type="date"
                value={currentTracker.dateReceived}
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
              <Form.Text className="text-muted">
                Select the date the document was received.
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>LCE Action</Form.Label>
              <Form.Select
                value={currentTracker.lceAction || "pending"}
                onChange={(e) => {
                  setCurrentTracker({
                    ...currentTracker,
                    lceAction: e.target.value,
                  });
                  console.log("Selected LCE Action:", e.target.value);
                }}
              >
                <option value="approved">Approved</option>
                <option value="disapproved">Disapproved</option>
                <option value="for your comments">For Your Comments</option>
                <option value="for review">For Review</option>
                <option value="for dissemination">For Dissemination</option>
                <option value="noted">Noted</option>
                <option value="check availability of fund">Check Availability of Fund</option>
                <option value="others">Others</option>
              </Form.Select>
              <Form.Text className="text-muted">
                Select the LCE action for this document.
              </Form.Text>
            </Form.Group>

            {currentTracker.lceAction !== undefined && (
              <Container className="mb-3 p-0">LCE Acted on: {currentTracker.lceActionDate}</Container>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Recipient Departments</Form.Label>
              <CustomDualListBox
                options={departmentOptions}
                selected={selectedDepartments}
                onChange={(selectedDeptIds) => {
                  const updatedRecipients = selectedDeptIds.map(deptId => {
                    const existingRecipient = currentTracker.recipient.find(
                      rec => rec.receivingDepartment === deptId
                    );
                    return existingRecipient || {
                      receivingDepartment: deptId,
                      receiveDate: new Date().toISOString(),
                      remarks: "",
                      status: "pending",
                    };
                  });

                  if (updatedRecipients.length === 0) {
                    setError("At least one recipient department must be selected.");
                  } else {
                    setError(null);
                  }

                  setCurrentTracker({
                    ...currentTracker,
                    recipient: updatedRecipients,
                  });
                }}
                filterPlaceholder="Search departments..."
                style={{ height: '200px' }}
              />
              <Form.Text className="text-muted">
                Select one or more recipient departments.
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Attachment (PDF or Image, max 50MB)</Form.Label>
              {modalType === "update" && currentTracker.attachment && (
                <div className="mb-2">
                  <span>Current: {currentTracker.attachmentName || "Attachment"}</span>
                </div>
              )}
              <Form.Control
                type="file"
                accept=".pdf,image/*"
                required={modalType === "create"}
                onBlur={() => {
                  if (modalType === "create" && !currentTracker.file) setError("An attachment is required.");
                }}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file && file.size > 64 * 1024 * 1024) {
                    setError("File size must not exceed 50MB.");
                  } else {
                    setError(null);
                    setCurrentTracker({
                      ...currentTracker,
                      file: file,
                      attachmentMimeType: file ? file.type : currentTracker.attachmentMimeType,
                    });
                  }
                }}
              />
              <Form.Text className="text-muted">
                {modalType === "create" ? "Upload a PDF or image file." : "Upload a new PDF file to replace the existing attachment."}
              </Form.Text>
            </Form.Group>
            {error && (
              <Alert
                variant="danger"
                onClose={() => setError(null)}
                dismissible
              >
                {error}
              </Alert>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <OverlayTrigger placement="top" overlay={<Tooltip>Cancel</Tooltip>}>
            <Button variant="link" onClick={() => setShowModal(false)}>
              <XCircle size={20} />
            </Button>
          </OverlayTrigger>
          <OverlayTrigger placement="top" overlay={<Tooltip>Save Tracker</Tooltip>}>
            <Button
              variant="link"
              onClick={handleSave}
              disabled={
                !currentTracker.fromName ||
                !currentTracker.documentTitle ||
                !currentTracker.dateReceived ||
                !currentTracker.recipient.length ||
                (modalType === "create" && !currentTracker.file)
              }
            >
              <PlusCircle size={20} />
            </Button>
          </OverlayTrigger>
        </Modal.Footer>
      </Modal>
      <Modal show={showQRModal} onHide={() => setShowQRModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Print QRCode</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {qrTracker && (
            <ErrorBoundary>
              <div
                id="printable-area"
                style={{
                  textAlign: "center",
                  padding: "20px",
                  width: "210mm",
                  height: "297mm",
                  maxWidth: "794px",
                  maxHeight: "1123px",
                  border: "1px solid #ccc",
                  position: "relative",
                  margin: "0 auto",
                }}
              >
                <Draggable
                  bounds="parent"
                  defaultPosition={{ x: 0, y: 0 }}
                  nodeRef={qrRef}
                >
                  <div
                    ref={qrRef}
                    style={{
                      display: "inline-block",
                      cursor: "move",
                      userSelect: "none",
                    }}
                  >
                    <QRCodeSVG
                      value={`https://commtracker.laoagcity.gov.ph/status/${qrTracker._id}`}
                      size={256}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="H"
                      imageSettings={{
                        src: "/laoaglogo-bw.png",
                        x: undefined,
                        y: undefined,
                        height: 48,
                        width: 48,
                        opacity: 1,
                        excavate: true,
                      }}
                    />
                    <br /> <span className="d-block mt-3">{qrTracker.serialNumber}</span>
                  </div>
                </Draggable>
              </div>
            </ErrorBoundary>
          )}
        </Modal.Body>
        <Modal.Footer>
          <OverlayTrigger placement="top" overlay={<Tooltip>Print QR Code</Tooltip>}>
            <Button variant="link" onClick={printAttachment}>
              <Printer size={20} />
            </Button>
          </OverlayTrigger>
          <OverlayTrigger placement="top" overlay={<Tooltip>Close</Tooltip>}>
            <Button variant="link" onClick={() => setShowQRModal(false)}>
              <XCircle size={20} />
            </Button>
          </OverlayTrigger>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default DTSReceivingDashboard;