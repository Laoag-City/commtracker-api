import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { isLoggedIn, getUserRole } from './utils/authUtils';

// Mock utility functions
jest.mock('./utils/authUtils', () => ({
  isLoggedIn: jest.fn(),
  getUserRole: jest.fn(),
}));

describe('App Navigation and Route Protection', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders Login link when user is not logged in', () => {
    isLoggedIn.mockReturnValue(false);
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    expect(screen.getByText(/Login/i)).toBeInTheDocument();
  });

  test('renders Logout link and admin links when admin is logged in', () => {
    isLoggedIn.mockReturnValue(true);
    getUserRole.mockReturnValue('admin');
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    expect(screen.getByText(/Manage Departments/i)).toBeInTheDocument();
    expect(screen.getByText(/Manage Groups/i)).toBeInTheDocument();
    expect(screen.getByText(/Manage Users/i)).toBeInTheDocument();
    expect(screen.getByText(/Logout/i)).toBeInTheDocument();
  });

  test('hides admin links when a non-admin user is logged in', () => {
    isLoggedIn.mockReturnValue(true);
    getUserRole.mockReturnValue('user');
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    expect(screen.getByText(/Manage Departments/i)).toBeInTheDocument();
    expect(screen.queryByText(/Manage Groups/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Manage Users/i)).not.toBeInTheDocument();
  });

  test('redirects to login when accessing admin routes without being logged in', () => {
    isLoggedIn.mockReturnValue(false);
    getUserRole.mockReturnValue(null);
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    expect(screen.getByText(/Login/i)).toBeInTheDocument();
    expect(screen.queryByText(/Manage Departments/i)).not.toBeInTheDocument();
  });
});
