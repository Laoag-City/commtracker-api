const { validateUserInput, validateLoginInput } = require('../../utils/validators');

describe('Validators Utility', () => {
  describe('validateUserInput', () => {
    it('should return null for valid input', () => {
      const data = { username: 'testuser', password: 'P@ssw0rd', userrole: 'user' };
      expect(validateUserInput(data)).toBeNull();
    });

    it('should return an error message for invalid username', () => {
      const data = { username: 'ab', password: 'P@ssw0rd', userrole: 'user' };
      expect(validateUserInput(data)).toBe('Username must be at least 3 characters long');
    });

    it('should return an error message for invalid password', () => {
      const data = { username: 'testuser', password: '123', userrole: 'user' };
      expect(validateUserInput(data)).toBe('Password must be at least 6 characters long');
    });

    it('should return an error message for invalid userrole', () => {
      const data = { username: 'testuser', password: 'P@ssw0rd', userrole: 'invalid' };
      expect(validateUserInput(data)).toBe('User role must be one of: admin, user, viewer');
    });
  });

  describe('validateLoginInput', () => {
    it('should return null for valid input', () => {
      const data = { username: 'testuser', password: 'P@ssw0rd' };
      expect(validateLoginInput(data)).toBeNull();
    });

    it('should return an error message for missing username', () => {
      const data = { password: 'P@ssw0rd' };
      expect(validateLoginInput(data)).toBe('Username is required');
    });

    it('should return an error message for missing password', () => {
      const data = { username: 'testuser' };
      expect(validateLoginInput(data)).toBe('Password is required');
    });
  });
});
