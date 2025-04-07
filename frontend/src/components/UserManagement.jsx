import { useState, useEffect } from 'react';
import { Card, Form, Button, Table, Container, Row, Col, Alert, Spinner, Pagination } from 'react-bootstrap';
import axios from 'axios';
import { fetchData } from '../utils/api'; // Adjust path as necessary

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userrole, setUserrole] = useState('');
  const [deptId, setDeptId] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchQuery]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    setError('');
    try {
      const data = await fetchData(
        `${import.meta.env.VITE_API_URL}/users?page=${currentPage}&limit=${usersPerPage}&search=${searchQuery}`,
        token
      );
      setUsers(data.users || []);
      setTotalPages(data.metadata.totalPages);
    } catch (error) {
      setError('Error fetching users. Please try again.', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    try {
      const data = await fetchData(`${import.meta.env.VITE_API_URL}/departments`, token);
      setDepartments(data);
    } catch (error) {
      setError('Error fetching departments. Please try again.', error);
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    setError('');
    setLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/users/register`,
        { username, password, userrole, deptId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
      clearForm();
    } catch (error) {
      setError('Error creating user. Please try again.', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    setError('');
    setLoading(true);
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/users/${editingUserId}`,
        { username, password, userrole, deptId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
      clearForm();
    } catch (error) {
      setError('Error updating user. Please try again.', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    const token = localStorage.getItem('token');
    setError('');
    setLoading(true);
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (error) {
      setError('Error deleting user. Please try again.', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (user) => {
    setUsername(user.username);
    setUserrole(user.userrole);
    setDeptId(user.deptId?._id || '');
    setEditingUserId(user._id);
  };

  const clearForm = () => {
    setUsername('');
    setPassword('');
    setUserrole('');
    setDeptId('');
    setEditingUserId(null);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <Container>
      <Card>
        <h2>User Management</h2>

        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={editingUserId ? updateUser : addUser}>
          <Card className="mb-3">
            <Row>
              <Col>
                <Form.Group>
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    minLength={3}
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group>
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!editingUserId} // Required for new users
                    pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$"
                    title="Password must be at least 6 characters long and include uppercase, lowercase, number, and special character"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col>
                <Form.Group>
                  <Form.Label>User Role</Form.Label>
                  <Form.Select
                    value={userrole}
                    onChange={(e) => setUserrole(e.target.value)}
                    required
                  >
                    <option value="">Select Role</option>
                    <option value="recipient">Department Recipient</option>
                    <option value="trackerreceiving">Receiving Account</option>
                    <option value="viewer">View Only</option>
                    <option value="trackermonitor">Communication Tracker Monitoring</option>
                    <option value="admin">Communication Tracker Administrator</option>
                    <option value="superadmin">Super Communication Tracker Administrator</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col>
                <Form.Group>
                  <Form.Label>Department</Form.Label>
                  <Form.Select
                    value={deptId}
                    onChange={(e) => setDeptId(e.target.value)}
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.deptName}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Button type="submit" className="mt-3" disabled={loading}>
              {editingUserId ? 'Update User' : 'Add User'}
            </Button>
            {editingUserId && (
              <Button variant="secondary" className="mt-3 ms-2" onClick={clearForm}>
                Cancel Edit
              </Button>
            )}
          </Card>
        </Form>
        <Card>
          <h3 className="mt-4">User List</h3>
          {loading && (
            <div className="text-center">
              <Spinner animation="border" />
            </div>
          )}
          {!loading && users.length === 0 && <Alert variant="info">No users found.</Alert>}
          <Row>
            <Col>
              <Form.Group>
                <Form.Label className="d-flex justify-content-start">Filter users :</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Filter by username or role..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="mb-3"
                />
              </Form.Group>
            </Col>
          </Row>
          {!loading && (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.username}</td>
                    <td>{user.userrole}</td>
                    <td>{user.deptId?.deptName || 'Unknown'}</td>
                    <td>
                      {/*console.log(user._id)*/}
                      <Button
                        variant="warning"
                        size="sm"
                        onClick={() => startEdit(user)}
                        className="me-2"
                        disabled={user._id.toString() === "67402ff28dbcd7f444983bbe"}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deleteUser(user._id)}
                        disabled={user._id.toString() === "67402ff28dbcd7f444983bbe"}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Pagination>
          {Array.from({ length: totalPages }, (_, index) => (
            <Pagination.Item
              key={index + 1}
              active={index + 1 === currentPage}
              onClick={() => paginate(index + 1)}
              disabled={loading}
            >
              {index + 1}
            </Pagination.Item>
          ))}
        </Pagination>
      </Card>

    </Container >
  );
}

export default UserManagement;
