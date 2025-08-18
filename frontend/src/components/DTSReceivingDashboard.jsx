import { useState, useEffect, useCallback, useMemo } from "react";
import { Table, Button, Modal, Form, Spinner, Alert, Pagination, InputGroup, FormControl, OverlayTrigger, Tooltip } from "react-bootstrap";
import { QRCodeSVG } from "qrcode.react";
import Draggable from 'react-draggable';
import { getLoginName, getUserRole } from "../utils/authUtils";
import { fetchData } from "../utils/api";
import axios from "axios";
import { formatDate } from '../utils/date';
import { debounce } from 'lodash';
import { PlusCircle, QrCode, Download, PencilSquare, Trash, Printer, XCircle } from 'react-bootstrap-icons'; // Import icons

const API_URL = import.meta.env.MODE === "production"
  ? import.meta.env.VITE_API_URL_PROD
  : import.meta.env.VITE_API_URL_DEV;

const VITE_URL = import.meta.env.VITE_URL_DEV || import.meta.env.VITE_URL_PROD || API_URL; // Added fallback

function DTSReceivingDashboard() {
  const [trackers, setTrackers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [trackersPerPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
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
    recipient: [],
    attachment: null,
    attachmentMimeType: null,
    username: userName,
    file: null,
  });

  const [showQRModal, setShowQRModal] = useState(false);
  const [qrTracker, setQRTracker] = useState(null);
  //  const [base64Attachment, setBase64Attachment] = useState(null);

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

  /*   const fetchAttachment = useCallback(async () => {
      if (currentTracker.attachment) {
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
    }, [currentTracker.attachment, currentTracker.attachmentMimeType, token]); */

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
    } catch (error) {
      setError("Error fetching groups: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const debouncedSearch = useMemo(
    () =>
      debounce((value) => {
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
    const formData = new FormData();
    formData.append("fromName", currentTracker.fromName);
    formData.append("documentTitle", currentTracker.documentTitle);
    formData.append("dateReceived", currentTracker.dateReceived);
    currentTracker.recipient.forEach((rec, index) => {
      formData.append(`recipient[${index}][receiveDate]`, rec.receiveDate);
      formData.append(`recipient[${index}][receivingDepartment]`, rec.receivingDepartment);
      formData.append(`recipient[${index}][status]`, rec.status);
      formData.append(`recipient[${index}][remarks]`, rec.remarks);
    });
    if (currentTracker.file) {
      formData.append("attachmentMimeType", currentTracker.file.type);
      formData.append("file", currentTracker.file);
    }

    try {
      await axios({
        method: modalType === "create" ? "post" : "put",
        url: modalType === "create"
          ? `${API_URL}/trackers/new`
          : `${API_URL}/trackers/${currentTracker._id}`,
        data: formData,
        headers: {
          ...authHeaders.headers,
          "Content-Type": "multipart/form-data",
        },
      });
      setShowModal(false);
      fetchTrackers();
    } catch (error) {
      console.error("Error saving tracker:", error.response?.data || error);
      setError(error.response?.data?.message || "Failed to save tracker.");
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
    setCurrentTracker(
      tracker || {
        fromName: "",
        documentTitle: "",
        dateReceived: "",
        recipient: [],
        attachment: null,
        username: userName,
        file: null,
      }
    );
    setShowModal(true);
  };

  return (
    <div className="p-4">
      <div className="display-6">Laoag City Internal Communication Tracking System</div>
      <h2>Document Tracker Receiving Dashboard</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <div className="d-flex justify-content-between align-items-center mb-3">
        {userRole === "trackerreceiving" && (
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Add New Tracker</Tooltip>}
          >
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
                        {/* <span className="text-muted">{rec.receiveDate ? ` - ${formatDate(rec.receiveDate)}` : " - N/A"}</span> */}
                        <span className="text-muted">{rec.dateSeen ? ` - ${formatDate(rec.dateSeen)}` : " - N/A"}</span>
                      </div>
                    ))}
                  </td>
                  <td>
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip>View QR Code</Tooltip>}
                    >
                      <Button variant="link" size="sm" onClick={() => openQRModal(tracker)}>
                        <QrCode size={20} />
                      </Button>
                    </OverlayTrigger>
                  </td>
                  <td>
                    {tracker.attachment ? (
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>Download Attachment</Tooltip>}
                      >
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
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip>Edit Tracker</Tooltip>}
                    >
                      <Button variant="link" size="sm" onClick={() => openModal("update", tracker)}>
                        <PencilSquare size={20} />
                      </Button>
                    </OverlayTrigger>
                    {userRole === "dtssuperadmin" && (
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>Delete Tracker</Tooltip>}
                      >
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
            </Form.Group>
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
            <Form.Group className="mb-3">
              <Form.Label>Recipients</Form.Label>
              <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #ced4da", padding: "10px", borderRadius: "4px" }}>
                {groups.map((group) => (
                  <Form.Check
                    key={group._id}
                    type="checkbox"
                    id={`group-${group._id}`}
                    label={group.groupName}
                    value={group._id}
                    checked={currentTracker.recipient.some((rec) =>
                      group.departmentIds.some((dept) => dept._id === rec.receivingDepartment)
                    )}
                    onChange={(e) => {
                      const groupId = e.target.value;
                      const selectedGroup = groups.find((g) => g._id === groupId);
                      let updatedRecipients = [...currentTracker.recipient];

                      if (e.target.checked) {
                        // Add departments from the selected group
                        const newRecipients = selectedGroup.departmentIds.map((dept) => ({
                          receivingDepartment: dept._id,
                          receiveDate: new Date(),
                          remarks: "",
                          status: "pending",
                        }));
                        updatedRecipients = [...updatedRecipients, ...newRecipients];
                      } else {
                        // Remove departments from the unselected group
                        updatedRecipients = updatedRecipients.filter(
                          (rec) => !selectedGroup.departmentIds.some((dept) => dept._id === rec.receivingDepartment)
                        );
                      }

                      // Remove duplicates by department ID
                      const uniqueRecipients = Array.from(
                        new Map(updatedRecipients.map((r) => [r.receivingDepartment, r])).values()
                      );

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
                  />
                ))}
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Attachment (PDF or Image, max 50MB)</Form.Label>
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
                    });
                  }
                }}
              />
            </Form.Group>
            {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Cancel</Tooltip>}
          >
            <Button variant="link" onClick={() => setShowModal(false)}>
              <XCircle size={20} />
            </Button>
          </OverlayTrigger>
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Save Tracker</Tooltip>}
          >
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
                position: "relative",
              }}
            >
              {import.meta.env.MODE === 'production' ? (
                <QRCodeSVG
                  value={`https://commtracker.laoagcity.gov.ph/status/${qrTracker._id}`}
                  size={128}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="H"
                  imageSettings={{
                    src: "/laoaglogo-bw.png",
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
                  value={`https://commtracker.laoagcity.gov.ph/status/${qrTracker._id}`}
                  size={128}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="L"
                  imageSettings={{
                    src: "/laoaglogo-bw.png",
                    x: undefined,
                    y: undefined,
                    height: 16,
                    width: 16,
                    opacity: 1,
                    excavate: true,
                  }}
                />
              )}
              <br /><span className="d-block mt-3">{qrTracker._id}</span>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Print QR Code</Tooltip>}
          >
            <Button variant="link" onClick={printAttachment}>
              <Printer size={20} />
            </Button>
          </OverlayTrigger>
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Close</Tooltip>}
          >
            <Button variant="link" onClick={() => setShowQRModal(false)}>
              <XCircle size={20} />
            </Button>
          </OverlayTrigger>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default DTSReceivingDashboard;