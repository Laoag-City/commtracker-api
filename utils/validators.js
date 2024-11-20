/**
 * Validates user input for registration or update actions
 * @param {Object} data - User data to validate
 * @returns {String|null} - Returns validation error message, or null if valid
 */
exports.validateUserInput = (data) => {
  const { username, password, userrole } = data;

  // Check username
  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    return 'Username must be at least 3 characters long';
  }

  // Check password
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
  if (!password || !passwordRegex.test(password)) {
    return 'Password must be at least 6 characters long and include uppercase, lowercase, number, and special character';
  }

  // Check user role
  //const allowedRoles = ['admin', 'user', 'viewer'];
  const allowedRoles = ['admin','trackerreceiving','recipient', 'viewer'];
  if (!userrole || !allowedRoles.includes(userrole)) {
    return `User role must be one of: ${allowedRoles.join(', ')}`;
  }

  return null; // No validation errors
};

/**
 * Validates user input for registration or update actions
 * @param {Object} data - User data to validate
 * @returns {String|null} - Returns validation error message, or null if valid
exports.validateUserInput = (data) => {
  const { username, password, userrole } = data;

  // Check username
  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    return 'Username must be at least 3 characters long';
  }

  // Check password
  if (!password || typeof password !== 'string' || password.length < 6) {
    return 'Password must be at least 6 characters long';
  }

  // Check user role
  //const allowedRoles = ['admin', 'user', 'viewer'];
  const allowedRoles = ['admin','trackerreceiving','recipient', 'viewer'];
  if (!userrole || !allowedRoles.includes(userrole)) {
    return `User role must be one of: ${allowedRoles.join(', ')}`;
  }

  return null; // No validation errors
};

/**
 * Validates login input
 * @param {Object} data - Login data to validate
 * @returns {String|null} - Returns validation error message, or null if valid  (put comment end marker below)
exports.validateLoginInput = (data) => {
  const { username, password } = data;

  if (!username || typeof username !== 'string') {
    return 'Username is required';
  }

  if (!password || typeof password !== 'string') {
    return 'Password is required';
  }

  return null; // No validation errors
};
 */
