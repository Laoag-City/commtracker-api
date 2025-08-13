import { useEffect, useState } from 'react';
import { Form, Container, ButtonGroup, Button, InputGroup } from 'react-bootstrap';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { isLoggedIn, logout, getUserRole, getLoginName } from '../utils/authUtils';


function Home() {
  const navigate = useNavigate();
  const { mongoid } = useParams(); // Extract mongoid from URL path (e.g., /status/:mongoid)
  const [trackingId, setTrackingId] = useState('');

  useEffect(() => {
    // If mongoid is provided in the URL, redirect to status page with mongoid
    if (mongoid) {
      navigate(`/status/${mongoid}`);
      return; // Prevent further redirects
    }
    // Example: get user role from localStorage or context
    //const userRole = localStorage.getItem('role');
    const userRole = getUserRole();
    if (userRole === 'recipient') {
      navigate('/dtsrecipient');
    } else if (userRole === 'trackerreceiving') {
      navigate('/dtsreceiving');
    } else if (userRole === 'trackermonitor') {
      navigate('/dtsmonitor');
    } else if (userRole === 'management') {
      navigate('/dtsmanagement');
    } else if (userRole === 'superadmin') {
      navigate('/departments');
    } else if (userRole === 'group') {
      navigate('/groups');
    } else if (userRole === 'user') {
      navigate('/users');
    } else if (userRole === null || userRole === undefined) {
      navigate('/status');
      return;
    }
    // Add more roles as needed
  });

  // Handle tracking ID form submission
  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (trackingId.trim()) {
      navigate(`/status/${trackingId}`);
    }
  };

  return (
    <Container className="py-3 text-center">
      <h3>Welcome to Laoag City&apos;s Internal Communication Tracking System</h3>
      <p>Track a document or log in to access your dashboard.</p>

      {/* Form for entering tracking ID */}
      <Form onSubmit={handleTrackSubmit} className="mb-3">
        <InputGroup className="mx-auto" style={{ maxWidth: '400px' }}>
          <Form.Control
            type="text"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            placeholder="Enter Tracking ID"
          />
          <Button type="submit" variant="primary">
            Track Document
          </Button>
        </InputGroup>
      </Form>

      <ButtonGroup vertical>
        <Button as={NavLink} to="/status" variant="primary" className="mb-2">
          Check Status
        </Button>
        {!isLoggedIn() && (
          <Button as={NavLink} to="/login" variant="secondary" className="mb-2">
            Login
          </Button>
        )}
      </ButtonGroup>
      {/*
      <p>Welcome to Laoag City&apos;s Internal Communication Tracking System </p>
      <ListGroup>
        <ListGroup.Item variant="primary" as={NavLink} to="/status">
          Track Document
        </ListGroup.Item>
        <ListGroup.Item variant="secondary" as={NavLink} to="/login">
          Login
        </ListGroup.Item> 
      </ListGroup>      
            <ButtonGroup vertical>
        <Button as={NavLink} to="/status" variant="primary" className="mb-2">
          Track Document
        </Button>
        <Button as={NavLink} to="/login" variant="info" className="mb-2">
          Login
        </Button>

      </ButtonGroup>

      <ButtonGroup vertical>
        <Button as={NavLink} to="/status" variant="primary" className="mb-2">
          Check Status
        </Button>
        <Button as={NavLink} to="/login" variant="secondary" className="mb-2">
          Login
        </Button>
        <Button as={NavLink} to="/dtsrecipient" variant="info" className="mb-2">
          Recipient Dashboard
        </Button>
        <Button as={NavLink} to="/dtsreceiving" variant="success" className="mb-2">
          Receiving Dashboard
        </Button>
        <Button as={NavLink} to="/dtsmonitor" variant="warning" className="mb-2">
          Monitor Dashboard
        </Button>
        <Button as={NavLink} to="/dtsmanagement" variant="danger" className="mb-2">
          DTS Management
        </Button>
        <Button as={NavLink} to="/departments" variant="dark" className="mb-2">
          Department Management
        </Button>
        <Button as={NavLink} to="/groups" variant="secondary" className="mb-2">
          Group Management
        </Button>
        <Button as={NavLink} to="/users" variant="primary" className="mb-2">
          User Management
        </Button>
      </ButtonGroup> 
    */}

    </Container >
  );
}
export default Home;