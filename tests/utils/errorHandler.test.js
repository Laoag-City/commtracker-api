const { handleError } = require('../../utils/errorHandler');

describe('Error Handler Utility', () => {
  let mockRes;

  beforeEach(() => {
    // Mock Express `res` object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('should handle ValidationError with status 400', () => {
    const error = { name: 'ValidationError', errors: { field: 'Invalid field' } };
    const message = 'Validation error occurred';

    handleError(mockRes, error, message);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ message, details: error.errors });
  });

  it('should handle CastError with status 404', () => {
    const error = { name: 'CastError', kind: 'ObjectId' };
    const message = 'Resource not found';

    handleError(mockRes, error, message);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid ID format' });
  });

  it('should handle default errors with status 500', () => {
    const error = { name: 'UnknownError', message: 'Unexpected error occurred' };
    const message = 'Server error';

    handleError(mockRes, error, message);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ message, error: error.message });
  });
});
