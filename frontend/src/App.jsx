// src/App.js
//import React, { Suspense, lazy } from 'react';
import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { isLoggedIn, logout, getUserRole, getLoginName } from './utils/authUtils';
import Footer from './components/Footer';
import './App.css';

const Home = lazy(() => import('./components/Home'));
const Login = lazy(() => import('./components/Login'));
const DepartmentManagement = lazy(() => import('./components/DepartmentManagement'));
const UserManagement = lazy(() => import('./components/UserManagement'));
const GroupManagement = lazy(() => import('./components/GroupManagement'));
const DTSManagement = lazy(() => import('./components/DTSManagement'));
const DTSRecipientDashboard = lazy(() => import('./components/DTSRecipientDashboard'));
const DTSMonitorDashboard = lazy(() => import('./components/DTSMonitorDashboard'));
const DTSReceivingDashboard = lazy(() => import('./components/DTSReceivingDashboard'));
const DTSStatus = lazy(() => import('./components/DTSStatus'));

function App() {
  const navigate = useNavigate();
  const userRole = getUserRole();
  const userName = getLoginName();
  const handleLogout = () => logout(navigate);

  const renderNavLinks = () => {
    /*     if (!isLoggedIn()) {
          return <Nav.Link className="justify-content-end" as={NavLink} to="/login">Login</Nav.Link>;
        } */

    const roleBasedLinks = [
      { to: "/dtsrecipient", label: "Dashboard", roles: ["recipient"] },
      { to: "/dtsreceiving", label: "Receiving Dashboard", roles: ["trackerreceiving"] },
      { to: "/dtsmonitor", label: "Monitor Dashboard", roles: ["trackermonitor"] },
      { to: "/dtsmanagement", label: "DTS Mgmt", roles: ["admin", "superadmin"] },
      { to: "/departments", label: "Dept. Management", roles: ["admin", "superadmin"] },
      { to: "/groups", label: "Group Management", roles: ["admin", "superadmin"] },
      { to: "/users", label: "Manage Users", roles: ["superadmin"] },
    ];

    return (
      <>
        {roleBasedLinks
          .filter(link => link.roles.includes(userRole))
          .map(link => (
            <Nav.Link key={link.to} as={NavLink} to={link.to}>
              {link.label}
            </Nav.Link>
          ))}
      </>
    );
  };

  return (
    <div>
      <Navbar expand="lg" bg="light">
        <Container>
          <Navbar.Brand as={NavLink} to="/">
            <img
              src="/laoaglogo.png"
              width="64"
              height="64"
              className="d-inline-block align-top"
              alt="City Government of Laoag Logo"
            />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />

          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Navbar.Text>{isLoggedIn() ? '' : 'Welcome to Laoag City\'s Document Tracking System'}</Navbar.Text>
              {renderNavLinks()}
            </Nav>
            <Navbar.Collapse className="justify-content-end">
              {isLoggedIn() ?
                <Nav.Link as="button" className="btn btn-link" onClick={handleLogout}>Logout {isLoggedIn ? userName : ''}</Nav.Link>
                : <Nav.Link className="justify-content-end" as={NavLink} to="/login">Login</Nav.Link>
              }
            </Navbar.Collapse>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/status/:id" element={<DTSStatus />} />
          <Route path="/status/" element={<DTSStatus />} />
          <Route path="/login" element={isLoggedIn() ? <Navigate to="/" /> : <Login />} />
          <Route
            path="/dtsrecipient"
            element={isLoggedIn() && userRole === "recipient" ? <DTSRecipientDashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/dtsreceiving"
            element={isLoggedIn() && (userRole === "trackerreceiving") ? <DTSReceivingDashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/dtsmonitor"
            element={isLoggedIn() && userRole === "trackermonitor" ? <DTSMonitorDashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/dtsmanagement"
            element={isLoggedIn() && ["admin", "superadmin"].includes(userRole) ? <DTSManagement /> : <Navigate to="/login" />}
          />
          <Route
            path="/departments"
            element={isLoggedIn() && ["admin", "superadmin"].includes(userRole) ? <DepartmentManagement /> : <Navigate to="/login" />}
          />
          <Route
            path="/groups"
            element={isLoggedIn() && ["admin", "superadmin"].includes(userRole) ? <GroupManagement /> : <Navigate to="/login" />}
          />
          <Route
            path="/users"
            element={isLoggedIn() && userRole === "superadmin" ? <UserManagement /> : <Navigate to="/login" />}
          />
        </Routes>
      </Suspense>

      <Footer />
    </div>
  );
}

export default App;
