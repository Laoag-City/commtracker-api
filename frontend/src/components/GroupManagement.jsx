import { useState, useEffect } from 'react';
import {
  Form,
  Button,
  Container,
  Row,
  Col,
  Table,
  Card,
  Spinner,
  Alert, OverlayTrigger, Tooltip
} from 'react-bootstrap';
import DualListBox from 'react-dual-listbox';
import 'react-dual-listbox/lib/react-dual-listbox.css';
import { fetchData } from '../utils/api';
import axios from 'axios';
function GroupManagement() {
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [departmentIds, setDepartmentIds] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]); // Filtered department list
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentSearch, setDepartmentSearch] = useState(''); // Department search input state

  const token = localStorage.getItem('token');
  const API_URL = import.meta.env.MODE === "production"
    ? import.meta.env.VITE_API_URL_PROD
    : import.meta.env.VITE_API_URL_DEV;

  //  const VITE_URL = import.meta.env.VITE_URL_DEV || import.meta.env.VITE_URL_PROD || API_URL; // Added fallback

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const groupsData = await fetchData(`${API_URL}/groups`, token);
        setGroups(groupsData);
        setFilteredGroups(groupsData);
        const departmentsData = await fetchData(
          `${API_URL}/departments`,
          token
        );
        setDepartments(departmentsData);
        setFilteredDepartments(departmentsData); // Initialize filtered departments
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  useEffect(() => {
    // Dynamically filter departments when `departmentSearch` changes
    const filtered = departments.filter(
      (dept) =>
        dept.deptCode <= 1000 &&
        dept.deptName.toLowerCase().includes(departmentSearch.toLowerCase())
    );
    setFilteredDepartments(filtered);
  }, [departmentSearch, departments]);

  const resetForm = () => {
    setGroupName('');
    setDepartmentIds([]);
    setEditMode(false);
    setEditingGroupId(null);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    const lowerCaseQuery = query.toLowerCase();
    const filtered = groups.filter(
      (group) =>
        group.groupName.toLowerCase().includes(lowerCaseQuery) ||
        group.departmentIds.some((dept) => dept.deptName.toLowerCase().includes(lowerCaseQuery))
    );
    setFilteredGroups(filtered);
  };

  const addOrEditGroup = async (e) => {
    e.preventDefault();
    if (!groupName || departmentIds.length === 0) {
      setError('Group name and at least one department must be selected');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    const url = editMode
      ? `${API_URL}/groups/${editingGroupId}`
      : `${API_URL}/groups/new`;

    try {
      const method = editMode ? 'put' : 'post';
      await axios[method](
        url,
        { groupName, departmentIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(editMode ? 'Group updated successfully!' : 'Group added successfully!');
      const updatedGroups = await fetchData(`${API_URL}/groups`, token);
      setGroups(updatedGroups);
      setFilteredGroups(updatedGroups);
      resetForm();
    } catch (error) {
      setError(editMode ? 'Error updating group' : 'Error adding group');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteGroup = async (groupId) => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`${API_URL}/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Group deleted successfully!');
      const updatedGroups = await fetchData(`${API_URL}/groups`, token);
      setGroups(updatedGroups);
      setFilteredGroups(updatedGroups);
    } catch (error) {
      setError('Error deleting group');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (group) => {
    setEditMode(true);
    setEditingGroupId(group._id);
    setGroupName(group.groupName);
    setDepartmentIds(group.departmentIds.map((dept) => dept._id));
  };

  return (
    <Container>
      <Card>
        <Row>
          <Col>
            <h2>Group Management</h2>
          </Col>
        </Row>
        {error && (
          <Row>
            <Col>
              <Alert variant="danger" onClose={() => setError(null)} dismissible>
                {error}
              </Alert>
            </Col>
          </Row>
        )}
        {success && (
          <Row>
            <Col>
              <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
                {success}
              </Alert>
            </Col>
          </Row>
        )}
        <Card>
          <Card.Body>
            <Card.Title>{editMode ? 'Edit Receiving Group' : 'Add Receiving Group'}</Card.Title>
            <Form onSubmit={addOrEditGroup}>
              <Form.Group>
                <Form.Label>Receiving Group Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter group name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Search Departments</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Filter departments by name"
                  value={departmentSearch}
                  onChange={(e) => setDepartmentSearch(e.target.value)}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Select Departments / Division</Form.Label>
                {filteredDepartments.length > 0 ? (
                  <DualListBox
                    options={filteredDepartments.map((dept) => ({
                      value: dept._id,
                      label: dept.deptName,
                    }))}
                    selected={departmentIds}
                    onChange={(selected) => setDepartmentIds(selected)}
                  />
                ) : (
                  <Alert variant="info">No departments match the search criteria.</Alert>
                )}
              </Form.Group>
              <hr></hr>
              <Row className='mb-3'>
                <Col>
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? 'Saving...' : editMode ? 'Update' : 'Add Group'}
                  </Button></Col>
                {editMode && (
                  <Col>
                    <Button variant="secondary" onClick={resetForm}>
                      Cancel
                    </Button></Col>
                )}
              </Row>
            </Form>
          </Card.Body>
        </Card>
        <Card className='mb-3'>
          <Card.Body>
            <Card.Title>Group List</Card.Title>
            <Form.Group>
              <Form.Control
                type="text"
                placeholder="Search groups or departments"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </Form.Group>
            {loading ? (
              <Spinner animation="border" variant="primary" />
            ) : (
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Group Name</th>
                    <th>Departments</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGroups.map((group, index) => (
                    <tr key={group._id}>
                      <td>{index + 1}</td>
                      <td>{group.groupName}</td>
                      <td>{group.departmentIds.map((dept) => dept.deptName).join(', ')}</td>
                      <td>
                        {group._id === '67452fe864bea80431549c62' ? (
                          <>
                            <OverlayTrigger
                              overlay={
                                <Tooltip>
                                  Editing is disabled for this group.
                                </Tooltip>
                              }
                            >
                              <span className="d-inline-block">
                                <Button
                                  variant="warning"
                                  size="sm"
                                  className="me-2"
                                  disabled
                                  style={{ pointerEvents: 'none' }}
                                >
                                  Edit
                                </Button>
                              </span>
                            </OverlayTrigger>
                            <OverlayTrigger
                              overlay={
                                <Tooltip>
                                  Deletion is disabled for this group.
                                </Tooltip>
                              }
                            >
                              <span className="d-inline-block">
                                <Button
                                  variant="danger"
                                  size="sm"
                                  disabled
                                  style={{ pointerEvents: 'none' }}
                                >
                                  Delete
                                </Button>
                              </span>
                            </OverlayTrigger>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="warning"
                              size="sm"
                              onClick={() => handleEdit(group)}
                              className="me-2"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => deleteGroup(group._id)}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      </Card >
    </Container >
  );
}

export default GroupManagement;
