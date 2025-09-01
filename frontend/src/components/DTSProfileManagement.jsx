// file DTS ProfileManagement.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button, Alert } from 'react-bootstrap';
const API_URL = import.meta.env.MODE === "production"
  ? import.meta.env.VITE_API_URL_PROD
  : import.meta.env.VITE_API_URL_DEV;

//function DTSProfileManagement() { }
export default function DTSProfileManagement() {
  const [profile, setProfile] = useState({});
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API_URL}/users/profile`);
        setProfile(response.data);
      } catch (err) {
        setError('Failed to fetch profile data.', err);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/users/profile`, profile);
      alert('Profile updated successfully!');
      navigate('/dtsrecipient'); // Redirect after update
    } catch (err) {
      setError('Failed to update profile.', err);
    }
  };

  return (
    <Container>
      <h2>DTS Profile Management</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleUpdateProfile}>
        <Form.Group controlId="formUsername">
          <Form.Label>Username</Form.Label>
          <Form.Control
            type="text"
            value={profile.username || ''}
            onChange={(e) => setProfile({ ...profile, username: e.target.value })}
            required
          />
        </Form.Group>
        <Form.Group controlId="formDepartment">
          <Form.Label>Department</Form.Label>
          <Form.Control
            type="text"
            value={profile.department || ''}
            onChange={(e) => setProfile({ ...profile, department: e.target.value })}
            required
          />
        </Form.Group>
        <Button variant="primary" type="submit">Update Profile</Button>
      </Form>
    </Container>
  );
}