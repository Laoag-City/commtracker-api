import { getUserRole, isLoggedIn } from './authUtils';
import jwtDecode from 'jwt-decode';

jest.mock('jwt-decode'); // Mock jwtDecode

describe('authUtils', () => {
  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('getUserRole', () => {
    test('returns the role if token is valid and contains role', () => {
      const mockToken = 'mock.token.here';
      localStorage.setItem('token', mockToken);

      jwtDecode.mockReturnValue({ role: 'admin' });

      const role = getUserRole();
      expect(jwtDecode).toHaveBeenCalledWith(mockToken);
      expect(role).toBe('admin');
    });

    test('returns null if token does not contain a role', () => {
      const mockToken = 'mock.token.here';
      localStorage.setItem('token', mockToken);

      jwtDecode.mockReturnValue({});

      const role = getUserRole();
      expect(jwtDecode).toHaveBeenCalledWith(mockToken);
      expect(role).toBeNull();
    });

    test('returns null if token is invalid', () => {
      localStorage.setItem('token', 'invalid.token');
      jwtDecode.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const role = getUserRole();
      expect(role).toBeNull();
    });
  });

  describe('isLoggedIn', () => {
    test('returns true if token is valid and not expired', () => {
      const mockToken = 'mock.token.here';
      localStorage.setItem('token', mockToken);

      jwtDecode.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 }); // Expiry 1 hour later

      const loggedIn = isLoggedIn();
      expect(jwtDecode).toHaveBeenCalledWith(mockToken);
      expect(loggedIn).toBe(true);
    });

    test('returns false if token is expired', () => {
      const mockToken = 'mock.token.here';
      localStorage.setItem('token', mockToken);

      jwtDecode.mockReturnValue({ exp: Math.floor(Date.now() / 1000) - 3600 }); // Expired 1 hour ago

      const loggedIn = isLoggedIn();
      expect(jwtDecode).toHaveBeenCalledWith(mockToken);
      expect(loggedIn).toBe(false);
    });

    test('returns false if token is invalid', () => {
      localStorage.setItem('token', 'invalid.token');
      jwtDecode.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const loggedIn = isLoggedIn();
      expect(loggedIn).toBe(false);
    });

    test('returns false if token is missing', () => {
      const loggedIn = isLoggedIn();
      expect(loggedIn).toBe(false);
    });
  });
});
