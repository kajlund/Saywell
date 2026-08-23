/**
 * Sends a standardized success HTTP response.
 *
 * @param {import('express').Response} res - Express response object
 * @param {Object} options
 * @param {number} [options.statusCode=200] - HTTP status code
 * @param {*} [options.data] - Main payload data
 * @param {string} [options.message] - Optional success message
 * @param {Object} [options.meta] - Metadata such as pagination or query info
 */
export const sendSuccess = (res, { statusCode = 200, data, message, meta } = {}) => {
  const payload = {
    success: true,
  };

  if (message !== undefined) {
    payload.message = message;
  }

  if (meta !== undefined) {
    payload.meta = meta;
  }

  if (data !== undefined) {
    payload.data = data;
  }

  return res.status(statusCode).json(payload);
};

/**
 * Sends a standardized error HTTP response.
 *
 * @param {import('express').Response} res - Express response object
 * @param {Object} options
 * @param {number} [options.statusCode=500] - HTTP status code
 * @param {string|Array} [options.error='Server Error'] - Error description or list of error messages
 */
export const sendError = (res, { statusCode = 500, error = 'Server Error' } = {}) => {
  return res.status(statusCode).json({
    success: false,
    error,
  });
};
