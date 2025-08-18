import { jwtDecode } from 'jwt-decode';

/**
 * Retrieve a value from the token payload by key.
 * @param {string} key - The key to retrieve from the token payload.
 * @returns {string|null} The value corresponding to the key or null if unavailable.
 */
const getTokenPayloadValue = (keyPath) => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const decodedToken = jwtDecode(token);

    // Traverse nested keys if dot notation is used
    const keys = keyPath.split('.');
    let value = decodedToken;
    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = value[key];
      } else {
        return null; // Key not found in the path
      }
    }
    return value || null;
  } catch (error) {
    console.error(`Failed to decode token for key path "${keyPath}":`, error);
    return null;
  }
};

/**
 * Get the user's role from the JWT token.
 * @returns {string|null} User role (e.g., 'admin', 'user') or null if not available.
 */
export const getUserRole = () => getTokenPayloadValue('userrole');

/**
 * Get the username from the JWT token.
 * @returns {string|null} Username or null if not available.
 */
export const getLoginName = () => getTokenPayloadValue('username');

/**
 * Get the department ID from the JWT token.
 * @returns {string|null} Department ID or null if not available.
 */
export const getDeptId = () => getTokenPayloadValue('deptId._id');

/**
 * Check if the user is logged in by verifying the presence and validity of the token.
 * @returns {boolean} True if the user is logged in; otherwise, false.
 */

/**
 * Get the department code from the JWT token.
 * @returns {string|null} Department code or null if not available.
 */
export const getDeptCode = () => getTokenPayloadValue('deptId.deptCode');

/**
 * Get the department code from the JWT token.
 * @returns {string|null} Department code or null if not available.
 */
export const getDeptName = () => getTokenPayloadValue('deptId.deptName');

export const getDeptInitial = () => getTokenPayloadValue('deptId.initial')

export const isLoggedIn = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    const decodedToken = jwtDecode(token);
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    return decodedToken.exp && decodedToken.exp > currentTime; // Check expiration
  } catch (error) {
    console.error('Failed to decode or validate token:', error);
    return false;
  }
};

/**
 * Logout the user by clearing their token and redirecting to login.
 * @param {Function} navigate - React Router navigate function.
 */
export const logout = (navigate) => {
  localStorage.clear(); // Clears all stored data for added security
  navigate('/login');
};


//old code below
/* import {jwtDecode} from 'jwt-decode';

/**
 * Get the user's role from the JWT token.
 * @returns {string|null} User role (e.g., 'admin', 'user') or null if not available.
// 
export const getUserRole = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const decodedToken = jwtDecode(token);
    //console.log(decodedToken);
    return decodedToken.userrole || null; // Assumes 'role' is a key in the token payload
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

export const getLoginName = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const decodedToken = jwtDecode(token);
    //console.log(decodedToken);
    return decodedToken.username || null; 
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

export const getDeptId = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const decodedToken = jwtDecode(token);
    //console.log(decodedToken);
    return decodedToken.deptId || null; 
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};
/**
 * Check if the user is logged in by verifying the presence and validity of the token.
 * @returns {boolean} True if the user is logged in; otherwise, false.
//
export const isLoggedIn = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    const decodedToken = jwtDecode(token);
    //console.log(decodedToken);
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    return decodedToken.exp && decodedToken.exp > currentTime; // Check expiration
  } catch (error) {
    console.error('Failed to decode or validate token:', error);
    return false;
  }
};

/**
 * Logout the user by clearing their token and redirecting to login.
 * @param {Function} navigate - React Router navigate function.
 //
export const logout = (navigate) => {
  localStorage.removeItem('token');
  navigate('/login');
};
 */