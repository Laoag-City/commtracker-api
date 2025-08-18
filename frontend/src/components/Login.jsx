import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Card, Alert, Container, Row, Col, Spinner } from 'react-bootstrap';
import { logout, isLoggedIn } from '../utils/authUtils'; // Import utility functions
const API_URL = import.meta.env.MODE === "production"
  ? import.meta.env.VITE_API_URL_PROD
  : import.meta.env.VITE_API_URL_DEV;

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn()) {
      navigate('/dtsrecipient');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await axios.post(`${API_URL}/users/login`, {
        username,
        password,
      });
      localStorage.setItem('token', response.data.token);
      navigate('/departments');
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 'Invalid username or password. Please try again.'
      );
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center">
      {/*       <Row className='w-100'>
        <Col xs={12} md={6} className="mx-auto">
          <Card className='p-4'>
            <Card.Title>Welcome to Laoag City&apos;s DTS</Card.Title>
          </Card>
        </Col>
      </Row> */}
      <Row className="w-100">
        <Col xs={12} md={6} className="mx-auto">
          <Card className="p-4">
            <Card.Body>
              <h2 className="text-center mb-4">Login</h2>
              {errorMessage && (
                <Alert variant="danger" onClose={() => setErrorMessage('')} dismissible>
                  {errorMessage}
                </Alert>
              )}
              <Form onSubmit={handleLogin}>
                <Form.Group className="mb-3" controlId="formUsername">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formPassword">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <Button variant="primary" type="submit" className="w-100" disabled={isLoading}>
                  {isLoading ? <Spinner animation="border" size="sm" /> : 'Login'}
                </Button>
              </Form>

              {isLoggedIn() && ( // Conditionally render the Logout button
                <Button
                  variant="secondary"
                  className="w-100 mt-3"
                  onClick={() => logout(navigate)}
                >
                  Logout
                </Button>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Login;

/* import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Card, Alert, Container, Row, Col, Spinner } from 'react-bootstrap';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Optionally verify token validity here before redirecting
      navigate('/departments');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(''); // Reset error message
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/users/login`, {
        username,
        password,
      });
      localStorage.setItem('token', response.data.token); // Store token
      navigate('/departments'); // Navigate after login
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 'Invalid username or password. Please try again.'
      );
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center">
      <Row className="w-100">
        <Col xs={12} md={6} className="mx-auto">
          <Card className="p-4">
            <Card.Body>
              <h2 className="text-center mb-4">Login</h2>
              {errorMessage && (
                <Alert variant="danger" onClose={() => setErrorMessage('')} dismissible>
                  {errorMessage}
                </Alert>
              )}
              <Form onSubmit={handleLogin}>
                <Form.Group className="mb-3" controlId="formUsername">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formPassword">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <Button variant="primary" type="submit" className="w-100" disabled={isLoading}>
                  {isLoading ? <Spinner animation="border" size="sm" /> : 'Login'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Login;
 */
/* import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Card, Alert, Container, Row, Col } from 'react-bootstrap';
//TODO: proper redirection if logged in.
function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/users/login`, {
        username,
        password,
      });
      localStorage.setItem('token', response.data.token); // Store token
      navigate('/departments'); // Navigate after login (can be adjusted based on role)
    } catch (error) {
      setErrorMessage('Invalid username or password. Please try again.');
      console.error('Login failed:', error);
    }
  };

  return (
    <Container className="d-flex justify-content-center">
      <Row className="w-100">
        <Col xs={12} md={6} className="mx-auto">
          <Card className="p-4">
            <Card.Body>
              <h2 className="text-center mb-4">Login</h2>
              {errorMessage && (
                <Alert variant="danger" onClose={() => setErrorMessage('')} dismissible>
                  {errorMessage}
                </Alert>
              )}
              <Form onSubmit={handleLogin}>
                <Form.Group className="mb-3" controlId="formUsername">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formPassword">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <Button variant="primary" type="submit" className="w-100">
                  Login
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Login;
 */