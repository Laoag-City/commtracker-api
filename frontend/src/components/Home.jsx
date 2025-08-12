import { useEffect } from 'react';
import { Container, ButtonGroup, Button, ListGroup } from 'react-bootstrap';
import { NavLink, useNavigate } from 'react-router-dom';
import { isLoggedIn, logout, getUserRole, getLoginName } from '../utils/authUtils';


function Home() {
  const navigate = useNavigate();
  useEffect(() => {
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
    } else if (userRole === 'department') {
      navigate('/departments');
    } else if (userRole === 'group') {
      navigate('/groups');
    } else if (userRole === 'user') {
      navigate('/users');
    } else if (userRole === null || userRole === undefined) {
      navigate('/status');
    }
    // Add more roles as needed
  });

  return (
    <Container className="py-3 text-center">
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