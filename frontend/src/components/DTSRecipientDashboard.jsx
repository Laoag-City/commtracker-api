import { useEffect, useState, useCallback } from "react";
import { Container, Image, Card, Table, Button, Form, Spinner, Modal, Alert, Row, Col, Pagination, OverlayTrigger, Tooltip } from "react-bootstrap";
import axios from "axios";
import { pdfjs, Document, Page } from "react-pdf";
//import RenderPdfFirstPage from "./RenderPDFFirstPage";
import { getDeptId, getLoginName, getDeptName } from "../utils/authUtils";
import { Check, X, Question, Eye } from 'react-bootstrap-icons';
pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.3.31/build/pdf.worker.min.mjs";
import { formatDate } from '../utils/date';

const API_URL = import.meta.env.MODE === "production"
  ? import.meta.env.VITE_API_URL_PROD
  : import.meta.env.VITE_API_URL_DEV;

const DTSRecipientDashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" });
  //  const [filters, setFilters] = useState({ status: "", dateFrom: "", dateTo: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [useOtherRemarks, setUseOtherRemarks] = useState(false);
  const [selectedRemarks, setSelectedRemarks] = useState([]);
  const token = localStorage.getItem("token");
  const userDeptId = getDeptId();
  const deptName = getDeptName();

  // Predefined remark options for checkboxes
  /*   const remarkOptions = [
      "Reviewed",
      "Needs Clarification",
      "Forward Please",
      "Action Taken",
    ];
   */
  const unsetStates = () => {
    setShowModal(false);
    setSelectedDoc(null);
    setSelectedRemarks([]);
    setUseOtherRemarks(false);
  }
  // Add this new function before the return statement
  /*   const handleRemarkChange = (remark) => {
      //console.log("Selected remark:", remark);
      if (remark === "Others") {
        setUseOtherRemarks(true);
        setSelectedRemarks(["Others"]);
        setSelectedDoc({ ...selectedDoc, remarks: "" });
      } else {
        if (useOtherRemarks) {
          setUseOtherRemarks(false);
        }
  
        const updatedRemarks = selectedRemarks.includes(remark)
          ? selectedRemarks.filter(r => r !== remark)
          : [...selectedRemarks, remark];
  
        setSelectedRemarks(updatedRemarks);
        setSelectedDoc({
          ...selectedDoc,
          remarks: updatedRemarks.filter(r => r !== "Others").join(", ")
        });
      }
    }; */

  // Set timeout for alert
  useEffect(() => {
    if (alert.show) {
      const timer = setTimeout(() => {
        setAlert({ show: false, message: "", variant: "" });
      }, 5000); // 5 seconds timeout
      return () => clearTimeout(timer); // Cleanup timer on unmount or alert change
    }
  }, [alert.show]);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/trackers/filter/department`, {
        params: { receivingDepartment: userDeptId, page: currentPage, limit: 10 },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setDocuments(response.data.data);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      setAlert({ show: true, message: "Failed to fetch documents. Please try again.", variant: "danger", error });
    }
    setLoading(false);
  }, [token, userDeptId, currentPage]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleSaveChanges = async () => {
    if (!selectedDoc) {
      console.log("No document selected for saving changes.");
      return;
    }
    try {
      const response = await axios.put(
        `${API_URL}/trackers/${selectedDoc._id}/recipient/${selectedDoc.recipient.recipientId}`,
        {
          username: getLoginName(),
          isSeen: true,
          dateSeen: new Date().toISOString(),
          remarks: selectedDoc.remarks,
          status: selectedDoc.status,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data) {
        setAlert({ show: true, message: "Document updated successfully!", variant: "success" });
        setShowModal(false);
        fetchDocuments();
      }
    } catch (error) {
      setAlert({ show: true, message: "Failed to update document. Please try again.", variant: "danger", error });
    }
  };

  // Helper function to determine row class based on status
  const getRowClass = (status) => {
    switch (status) {
      case "approved":
        return "table-success"; // Green background
      case "rejected":
        return "table-danger"; // Red background
      default:
        return "table-warning"; // Yellow background for pending or other statuses
    }
  };
  const handlePrint = async () => {
    try {
      // Create a hidden iframe to load the PDF
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      // Load the PDF in the iframe
      iframe.src = `${API_URL}/trackers/files/${selectedDoc.attachment}`;

      // Wait for the iframe to load
      await new Promise((resolve, reject) => {
        iframe.onload = () => resolve();
        iframe.onerror = () => reject(new Error('Failed to load PDF for printing.'));
      });

      // Trigger the print dialog
      iframe.contentWindow.focus();
      iframe.contentWindow.print();

      // Listen for the print dialog closing (approximate detection via blur event)
      const onAfterPrint = () => {
        document.body.removeChild(iframe); // Clean up iframe after printing
        window.removeEventListener('focus', onAfterPrint); // Remove listener
      };

      // Modern browsers support 'afterprint', but we use 'focus' as a fallback
      window.addEventListener('focus', onAfterPrint);

      // Fallback cleanup in case the print dialog is canceled
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
          window.removeEventListener('focus', onAfterPrint);
        }
      }, 30000); // 30 seconds fallback cleanup
    } catch (error) {
      setAlert({
        show: true,
        message: 'Failed to print the document. Please try again or download the file.',
        variant: 'danger',
      });
    }
  };
  // Render the component
  return (
    <Container fluid>
      <Row>
        <Col md={12} className="p-3">
          <Card className="mb-3">
            <Card.Body>
              {/*<Card.Title>Welcome {deptName}<Image src={`/logossml/${deptName}.png`} xs={6} className="" roundedCircle /></Card.Title>*/}
              <Card.Title>Welcome {deptName}</Card.Title>
              <Card.Text>
                {/* Total Communications: {documents.length} | Current Page: {currentPage} | Total Pages: {totalPages}*/}
              </Card.Text>
            </Card.Body>
          </Card>
          {alert.show && (
            <Alert variant={alert.variant} onClose={() => setAlert({ show: false })} dismissible>
              {alert.message}
            </Alert>
          )}
          {loading ? (
            <Spinner animation="border" />
          ) : (
            <>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>From</th>
                    <th>Title</th>
                    <th>Date Received</th>
                    <th><Eye size={20} /></th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) =>
                    doc.recipients.map((recipient) => (
                      <tr key={`${doc._id}-${recipient.receivingDepartment}`} className={getRowClass(recipient.status)}>
                        <td>{doc.fromName}</td>
                        <td>{doc.documentTitle}</td>
                        <td>{recipient.receiveDate ? formatDate(recipient.receiveDate) : "N/A"}</td>
                        <td>
                          <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip>View attachment</Tooltip>}
                          >
                            <Button variant="link" size="sm" onClick={() => { setSelectedDoc(doc); setShowAttachmentModal(true); }}>
                              <Eye size={20} />
                            </Button>
                          </OverlayTrigger>
                        </td>
                        <td>
                          {recipient.status === 'approved' ? (
                            <Check size={20} color="cornflowerblue" />
                          ) : recipient.status === "rejected" ? (
                            <X size={20} color="crimson" />
                          ) : (
                            <Question size={20} color="crimson" />
                          )}
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            disabled={recipient.status === 'approved'}
                            onClick={() => {
                              setSelectedDoc({
                                ...doc,
                                recipient,
                                remarks: recipient.remarks || "",
                                status: recipient.status || "pending" // Set default status to pending
                              });
                              setShowModal(true);
                              setUseOtherRemarks(false);
                              setSelectedRemarks([]);
                            }}
                          >
                            Reply
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
              <Pagination>
                {[...Array(totalPages).keys()].map((page) => (
                  <Pagination.Item
                    key={page + 1}
                    active={page + 1 === currentPage}
                    onClick={() => handlePageChange(page + 1)}
                  >
                    {page + 1}
                  </Pagination.Item>
                ))}
              </Pagination>
            </>
          )}
        </Col>
      </Row>
      {selectedDoc && selectedDoc.attachment && (
        <Modal show={showAttachmentModal} onHide={() => setShowAttachmentModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>PDF Viewer</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="d-flex justify-content-end mb-2">
              {/*               <Button variant="primary" onClick={() => { handlePrint() }}>Print</Button>*/}
              <Button
                variant="primary"
                onClick={() => {
                  // Print only the PDF area
                  const iframe = document.createElement('iframe');
                  iframe.style.position = 'fixed';
                  iframe.style.right = '0';
                  iframe.style.bottom = '0';
                  iframe.style.width = '0';
                  iframe.style.height = '0';
                  iframe.style.border = 'none';
                  iframe.src = `${API_URL}/trackers/files/${selectedDoc.attachment}`;
                  document.body.appendChild(iframe);
                  iframe.onload = function () {
                    iframe.contentWindow.focus();
                    iframe.contentWindow.print();
                    setTimeout(() => document.body.removeChild(iframe), 1000);
                  };
                }}
              >
                Download
              </Button>
            </div>
            <Document
              file={`${API_URL}/trackers/files/${selectedDoc.attachment}`}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {Array.from({ length: numPages || 0 }, (_, index) => (
                  <Page
                    key={index}
                    pageNumber={index + 1}
                    width={600}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                ))}
              </div>
            </Document>
          </Modal.Body>
        </Modal>
      )
      }
      {
        selectedDoc && (
          <Modal show={showModal} onHide={() => setShowModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Reply to Comms</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={selectedDoc?.status || "pending"}
                    onChange={(e) => setSelectedDoc({ ...selectedDoc, status: e.target.value })}
                  >
                    <option value="pending">-Pending-</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Remarks</Form.Label>

                  <Form.Control
                    as="textarea"
                    value={selectedDoc?.remarks || ""}
                    placeholder="Leave remarks here"
                    style={{ height: '200px' }}
                    onChange={(e) => setSelectedDoc({ ...selectedDoc, remarks: e.target.value })}
                  />
                  {/*
                <div className="mb-3">
                  {["Action taken", "Reviewed", "Please forward", "Needs clarification", "Others"].map((remark) => (
                    <Form.Check
                      key={remark}
                      type="checkbox"
                      id={`remark-${remark}`}
                      label={remark}
                      checked={remark === "Others" ? useOtherRemarks : selectedRemarks.includes(remark)}
                      onChange={() => handleRemarkChange(remark)}
                      disabled={useOtherRemarks && remark !== "Others"}
                    />
                  ))}
                </div>*/}
                  {useOtherRemarks && (
                    <Form.Control
                      as="textarea"
                      value={selectedDoc?.remarks || ""}
                      onChange={(e) => setSelectedDoc({ ...selectedDoc, remarks: e.target.value })}
                      placeholder="Enter other remarks..."
                    />
                  )}
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => unsetStates()}>
                Close
              </Button>
              <Button variant="primary" disabled={selectedDoc.status === 'pending'} onClick={handleSaveChanges}>
                Save Changes
              </Button>
            </Modal.Footer>
          </Modal>
        )
      }
    </Container >
  );
};

export default DTSRecipientDashboard;