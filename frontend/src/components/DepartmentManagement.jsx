import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Row,
  Col,
  Table,
  Form,
  Button,
  Modal,
  InputGroup,
  Card,
} from 'react-bootstrap';

function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [deptCode, setDeptCode] = useState('');
  const [deptName, setDeptName] = useState('');
  const [editingDeptId, setEditingDeptId] = useState(null); // Track the department being edited
  const [showModal, setShowModal] = useState(false); // Modal visibility state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState(null); // Target department for deletion
  const [formError, setFormError] = useState(''); // Validation error message

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Fetch all departments
  const fetchDepartments = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  // Create or update a department
  const handleSaveDepartment = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    // Validate form
    if (!deptCode || !deptName) {
      setFormError('Both department code and name are required.');
      return;
    }
    if (isNaN(deptCode) || deptCode < 0) {
      setFormError('Department code must be a valid positive number.');
      return;
    }

    try {
      if (editingDeptId) {
        // Update existing department
        await axios.put(
          `${import.meta.env.VITE_API_URL}/departments/${editingDeptId}`,
          { deptCode, deptName },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Add new department
        await axios.post(
          `${import.meta.env.VITE_API_URL}/departments/new`,
          { deptCode, deptName },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      fetchDepartments(); // Refresh the department list
      handleCloseModal();
    } catch (error) {
      console.error('Error saving department:', error);
    }
  };

  // Show confirmation dialog for deletion
  const confirmDelete = (department) => {
    setDeleteTarget(department);
    setShowDeleteConfirm(true);
  };

  // Handle deletion
  const handleDelete = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/departments/${deleteTarget._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDepartments(); // Refresh the department list
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting department:', error);
    }
  };

  // Set form values when editing
  const startEdit = (department) => {
    setDeptCode(department.deptCode);
    setDeptName(department.deptName);
    setEditingDeptId(department._id);
    setShowModal(true); // Open the modal for editing
  };

  // Clear form and reset editing state
  const clearForm = () => {
    setDeptCode('');
    setDeptName('');
    setEditingDeptId(null);
    setFormError('');
  };

  // Open and close the modal
  const handleShowModal = () => {
    clearForm();
    setShowModal(true);
  };

  const handleCloseModal = () => {
    clearForm();
    setShowModal(false);
  };

  return (
    <Container>
      <Card>
        <Row className="mb-4">
          <Col>
            <h2>Manage Departments</h2>
            <Button variant="primary" onClick={handleShowModal}>
              Add Department
            </Button>
          </Col>
        </Row>

        {/* Department List */}
        <Row>
          <Col>
            <h3>Department List</h3>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((department) => (
                  <tr key={department._id}>
                    <td>{department.deptCode}</td>
                    <td>{department.deptName}</td>
                    <td>
                      <Button
                        variant="warning"
                        size="sm"
                        className="me-2"
                        onClick={() => startEdit(department)}
                        disabled={department.deptCode > 1000} // Disable if deptCode > 1001
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => confirmDelete(department)}
                        disabled={department.deptCode > 1000} // Disable if deptCode > 1001
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Col>
        </Row>

        {/* Add/Edit Department Modal */}
        <Modal show={showModal} onHide={handleCloseModal}>
          <Modal.Header closeButton>
            <Modal.Title>
              {editingDeptId ? 'Edit Department' : 'Add Department'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {formError && <p className="text-danger">{formError}</p>}
            <Form onSubmit={handleSaveDepartment}>
              <Form.Group controlId="deptCode" className="mb-3">
                <Form.Label>Department Code</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="number"
                    placeholder="Enter department code"
                    value={deptCode}
                    onChange={(e) => setDeptCode(e.target.value)}
                    required
                  />
                </InputGroup>
              </Form.Group>

              <Form.Group controlId="deptName" className="mb-3">
                <Form.Label>Department Name</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Enter department name"
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                    required
                  />
                </InputGroup>
              </Form.Group>

              <Button variant="primary" type="submit" className="me-2">
                {editingDeptId ? 'Update Department' : 'Add Department'}
              </Button>
              <Button variant="secondary" onClick={handleCloseModal}>
                Cancel
              </Button>
            </Form>
          </Modal.Body>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Deletion</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Are you sure you want to delete the department{' '}
            <strong>{deleteTarget?.deptName}</strong>?
          </Modal.Body>
          <Modal.Footer>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>
      </Card>
    </Container>
  );
}

export default DepartmentManagement;

/* 
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Row,
  Col,
  Table,
  Form,
  Button,
  Modal,
  InputGroup,
} from 'react-bootstrap';

function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [deptCode, setDeptCode] = useState('');
  const [deptName, setDeptName] = useState('');
  const [editingDeptId, setEditingDeptId] = useState(null); // Track the department being edited
  const [showModal, setShowModal] = useState(false); // Modal visibility state

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Fetch all departments
  const fetchDepartments = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  // Create or update a department
  const handleSaveDepartment = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      if (editingDeptId) {
        // Update existing department
        await axios.put(
          `${import.meta.env.VITE_API_URL}/departments/${editingDeptId}`,
          { deptCode, deptName },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Add new department
        await axios.post(
          `${import.meta.env.VITE_API_URL}/departments/new`,
          { deptCode, deptName },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      fetchDepartments(); // Refresh the department list
      handleCloseModal();
    } catch (error) {
      console.error('Error saving department:', error);
    }
  };

  // Delete a department
  const deleteDepartment = async (id) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/departments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDepartments(); // Refresh the department list
    } catch (error) {
      console.error('Error deleting department:', error);
    }
  };

  // Set form values when editing
  const startEdit = (department) => {
    setDeptCode(department.deptCode);
    setDeptName(department.deptName);
    setEditingDeptId(department._id);
    setShowModal(true); // Open the modal for editing
  };

  // Clear form and reset editing state
  const clearForm = () => {
    setDeptCode('');
    setDeptName('');
    setEditingDeptId(null);
  };

  // Open and close the modal
  const handleShowModal = () => {
    clearForm();
    setShowModal(true);
  };

  const handleCloseModal = () => {
    clearForm();
    setShowModal(false);
  };

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h2>Manage Departments</h2>
          <Button variant="primary" onClick={handleShowModal}>
            Add Department
          </Button>
        </Col>
      </Row>

<Row>
  <Col>
    <h3>Department List</h3>
    <Table striped bordered hover>
      <thead>
        <tr>
          <th>Code</th>
          <th>Name</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {departments.map((department) => (
          <tr key={department._id}>
            <td>{department.deptCode}</td>
            <td>{department.deptName}</td>
            <td>
              <Button
                variant="warning"
                size="sm"
                className="me-2"
                onClick={() => startEdit(department)}
              >
                Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => deleteDepartment(department._id)}
              >
                Delete
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  </Col>
</Row>

<Modal show={showModal} onHide={handleCloseModal}>
  <Modal.Header closeButton>
    <Modal.Title>
      {editingDeptId ? 'Edit Department' : 'Add Department'}
    </Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <Form onSubmit={handleSaveDepartment}>
      <Form.Group controlId="deptCode" className="mb-3">
        <Form.Label>Department Code</Form.Label>
        <InputGroup>
          <Form.Control
            type="text"
            placeholder="Enter department code"
            value={deptCode}
            onChange={(e) => setDeptCode(e.target.value)}
            required
          />
        </InputGroup>
      </Form.Group>

      <Form.Group controlId="deptName" className="mb-3">
        <Form.Label>Department Name</Form.Label>
        <InputGroup>
          <Form.Control
            type="text"
            placeholder="Enter department name"
            value={deptName}
            onChange={(e) => setDeptName(e.target.value)}
            required
          />
        </InputGroup>
      </Form.Group>

      <Button variant="primary" type="submit" className="me-2">
        {editingDeptId ? 'Update Department' : 'Add Department'}
      </Button>
      <Button variant="secondary" onClick={handleCloseModal}>
        Cancel
      </Button>
    </Form>
  </Modal.Body>
</Modal>
    </Container >
  );
}

export default DepartmentManagement;

import { useState, useEffect } from 'react';
import axios from 'axios';

function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [deptCode, setDeptCode] = useState('');
  const [deptName, setDeptName] = useState('');
  const [editingDeptId, setEditingDeptId] = useState(null); // Track the department being edited

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Fetch all departments
  const fetchDepartments = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/departments`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setDepartments(response.data);
  };

  // Create a new department
  const addDepartment = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/departments/new`,
        { deptCode, deptName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDepartments(); // Refresh the list after creation
      clearForm();
    } catch (error) {
      console.error('Error creating department:', error);
    }
  };

  // Update a department
  const updateDepartment = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/departments/${editingDeptId}`,
        { deptCode, deptName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDepartments(); // Refresh the list after update
      clearForm();
    } catch (error) {
      console.error('Error updating department:', error);
    }
  };

  // Delete a department
  const deleteDepartment = async (id) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/departments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDepartments(); // Refresh the list after deletion
    } catch (error) {
      console.error('Error deleting department:', error);
    }
  };

  // Set form values when editing
  const startEdit = (department) => {
    setDeptCode(department.deptCode);
    setDeptName(department.deptName);
    setEditingDeptId(department._id);
  };

  // Clear form and reset editing state
  const clearForm = () => {
    setDeptCode('');
    setDeptName('');
    setEditingDeptId(null);
  };

  return (
    <div>
      <h2>Manage Departments</h2>

      //  Form to Add or Update Departments *
      <form onSubmit={editingDeptId ? updateDepartment : addDepartment}>
        <input
          type="text"
          placeholder="Department Code"
          value={deptCode}
          onChange={(e) => setDeptCode(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Department Name"
          value={deptName}
          onChange={(e) => setDeptName(e.target.value)}
          required
        />
        <button type="submit">{editingDeptId ? 'Update Department' : 'Add Department'}</button>
        {editingDeptId && <button onClick={clearForm}>Cancel Edit</button>}
      </form>

      // Department List
      <h3>Department List</h3>
      <ul>
        {departments.map((department) => (
          <li key={department._id}>
            <strong>{department.deptCode}</strong>: {department.deptName}
            <button onClick={() => startEdit(department)}>Edit</button>
            <button onClick={() => deleteDepartment(department._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DepartmentManagement;
 */