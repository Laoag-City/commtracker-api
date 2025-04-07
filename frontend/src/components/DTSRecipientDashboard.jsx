import { useEffect, useState, useCallback } from "react";
import { Container, Card, Table, Button, Form, Spinner, Modal, Alert, Row, Col, Pagination } from "react-bootstrap";
import axios from "axios";
import { pdfjs, Document, Page } from "react-pdf";
//import RenderPdfFirstPage from "./RenderPDFFirstPage";
import { getDeptId, getLoginName, getDeptName } from "../utils/authUtils";

//pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;\
pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs";
//import pdfWorker from "pdfjs-dist/build/pdf.worker?url";
//pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

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
  const [filters, setFilters] = useState({ status: "", dateFrom: "", dateTo: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const token = localStorage.getItem("token");
  const userDeptId = getDeptId();
  const deptName = getDeptName();

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

  return (
    <Container fluid>
      <Row>
        <Col md={3} className="p-3 bg-light border-end">
          <Card className="mb-3">
            <h5>Filters</h5>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="">All</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="pending">Pending</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Date From</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Date To</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                />
              </Form.Group>
              <Button variant="secondary" onClick={() => setFilters({ status: "", dateFrom: "", dateTo: "" })}>Clear Filters</Button>
            </Form>
          </Card>
        </Col>
        <Col md={9} className="p-3">
          <h2 className="my-4">Communications for {deptName}</h2>
          {alert.show && <Alert variant={alert.variant} onClose={() => setAlert({ show: false })} dismissible>{alert.message}</Alert>}
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
                    <th>Attachment</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) =>
                    doc.recipients.map((recipient) => (
                      <tr key={`${doc._id}-${recipient.receivingDepartment}`}>
                        <td>{doc.fromName}</td>
                        <td>{doc.documentTitle}</td>
                        <td>{recipient.departmentDetails.deptName}</td>
                        <td>
                          <Button variant="link" onClick={() => { setSelectedDoc(doc); setShowAttachmentModal(true); }}>
                            View Attachment
                          </Button>
                        </td>
                        <td>{recipient.status}</td>
                        <td>
                          <Button variant="primary" onClick={() => { setSelectedDoc({ ...doc, recipient, remarks: recipient.remarks, status: recipient.status }); setShowModal(true); }}>
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
              <Pagination>
                {[...Array(totalPages).keys()].map((page) => (
                  <Pagination.Item key={page + 1} active={page + 1 === currentPage} onClick={() => handlePageChange(page + 1)}>
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
            <Document file={`${API_URL}/trackers/files/${selectedDoc.attachment}`} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
              {[...Array(numPages)].map((_, index) => (
                <Page key={index} pageNumber={index + 1} width={600} />
              ))}
            </Document>
          </Modal.Body>
        </Modal>
      )}
    </Container>
  );
};

export default DTSRecipientDashboard;
