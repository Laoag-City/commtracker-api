//for trackermonitor userrole
// import { useState, useEffect, useCallback, useMemo } from "react";
// import { Container, Row, Col, Card, Form, Table, ButtonGroup, Button, Pagination, Spinner, Alert, Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
// import { NavLink, useNavigate } from "react-router-dom";
// import axios from "axios";
// import { fetchData } from "../utils/api";
// import { pdfjs, Document, Page } from "react-pdf";
// //import RenderPdfFirstPage from "./RenderPDFFirstPage";
// import { getDeptId, getLoginName, getDeptName } from "../utils/authUtils";
// import { Check, X, Question, Eye } from 'react-bootstrap-icons';
// pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.3.31/build/pdf.worker.min.mjs";
// import { formatDate } from '../utils/date';

import { useState, useEffect, useCallback, useMemo } from "react";
import { Container, Row, Col, Card, Table, Button, Modal, Spinner, Alert, Pagination, InputGroup, FormControl, OverlayTrigger, Tooltip } from "react-bootstrap";
import { QRCodeSVG } from "qrcode.react";
//import { getLoginName, getUserRole } from "../utils/authUtils";
import { fetchData } from "../utils/api";
import { formatDate } from '../utils/date';
import { debounce } from 'lodash';
import { Printer, XCircle } from 'react-bootstrap-icons'; // Import icons


const API_URL = import.meta.env.MODE === "production"
  ? import.meta.env.VITE_API_URL_PROD
  : import.meta.env.VITE_API_URL_DEV;

const VITE_URL = import.meta.env.VITE_URL_DEV || import.meta.env.VITE_URL_PROD || API_URL; // Added fallback

function DTSMonitorDashboard() {
  const [trackers, setTrackers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [trackersPerPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [documentCount, setDocumentCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");
  //  const userName = getLoginName();
  //  const userRole = getUserRole();

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [qrTracker, setQRTracker] = useState(null);

  const fetchTrackers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchData(
        `${API_URL}/trackers?page=${currentPage}&limit=${trackersPerPage}&search=${encodeURIComponent(searchQuery)}`,
        token
      );
      //console.log("Trackers metadata response:", response.metadata);
      setDocumentCount(response.metadata.totalTrackers || 0);
      //console.log(documentCount);
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

  const openPrintModal = (tracker) => {
    setQRTracker(tracker);
    setShowPrintModal(true);
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

  return (
    <Container className="p-4">
      <Row>
        <Col md={12} className="p-3">
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>DTS Monitor</Card.Title>
              <Card.Text>
                Active Documents: {documentCount} | Current Page: {currentPage} | Total Pages: {totalPages}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {error && <Alert variant="danger">{error}</Alert>}
      <div className="d-flex justify-content-between align-items-center mb-3">
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
              <tr className="table-primary text-center">
                <th>#</th>
                <th>From</th>
                <th>Title</th>
                <th>ReceiveDate</th>
                <th>Receiving Dept/s-Action-Remarks</th>
                <th><Printer size={20} /></th>
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
                      </div>
                    ))}
                  </td>
                  <td>
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip>Print Reply Slip</Tooltip>}
                    >
                      <Button variant="link" size="sm" onClick={() => openPrintModal(tracker)}>
                        <Printer size={20} />
                      </Button>
                    </OverlayTrigger>
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
      <Modal show={showPrintModal} onHide={() => setShowPrintModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Print Reply Slip</Modal.Title>
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
                  value={`${VITE_URL}/status/${qrTracker._id}`}
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
                  value={`${VITE_URL}/status/${qrTracker._id}`}
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
              <Table border size="sm">
                <tbody>
                  <tr>
                    <th>Title</th>
                    <td>{qrTracker.documentTitle}</td>
                  </tr>
                  <tr>
                    <th>Date Received</th>
                    <td>{new Date(qrTracker.dateReceived).toLocaleDateString()}</td>
                  </tr>
                </tbody>
              </Table>
              <h5>Actions</h5>
              <Table striped border size="sm">
                <thead>
                  <tr>
                    <th>Receiving Department/Division</th>
                    <th>Status</th>
                    <th>Remarks</th>
                    <th>Date Acted / Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {qrTracker.recipient.map((rec) => (
                    <tr key={rec._id}>
                      <td>{rec.receivingDepartment?.initial || "Unknown Department"}</td>
                      <td>{rec.status || "Unknown"}</td>
                      <td>{rec.remarks || "--"}</td>
                      <td>
                        {rec.receiveDate
                          ? new Date(rec.receiveDate).toLocaleDateString()
                          : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Print Reply </Tooltip>}
          >
            <Button variant="link" onClick={printAttachment}>
              <Printer size={20} />
            </Button>
          </OverlayTrigger>
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Close</Tooltip>}
          >
            <Button variant="link" onClick={() => setShowPrintModal(false)}>
              <XCircle size={20} />
            </Button>
          </OverlayTrigger>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default DTSMonitorDashboard