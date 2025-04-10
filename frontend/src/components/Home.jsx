import { Container, ButtonGroup, Button, ListGroup } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';

function Home() {
  return (
    <Container className="py-3 text-center">
      <p>Welcome to Laoag City&apos;s Internal Communication Tracking System </p>
      <ListGroup>
        <ListGroup.Item variant="primary" as={NavLink} to="/status">
          Track Document
        </ListGroup.Item>
        <ListGroup.Item variant="secondary" as={NavLink} to="/login">
          Login
        </ListGroup.Item>
      </ListGroup>
      {/*       
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
      </ButtonGroup> */}

    </Container>
  );
}
export default Home;