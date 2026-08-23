import { CustomError } from '../errors.js';
import { sendError } from '../utils/response.js';

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  if (req.logger) {
    req.logger.error(err);
  } else {
    console.error(err);
  }

  // Handle custom domain errors (NotFoundError, BadRequestError, etc.)
  if (err instanceof CustomError || err.statusCode) {
    return sendError(res, {
      statusCode: err.statusCode || 500,
      error: err.message,
    });
  }

  // Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid field: ${err.path}`;
    return sendError(res, { statusCode: 404, error: message });
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message);
    return sendError(res, { statusCode: 400, error: message });
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    return sendError(res, { statusCode: 400, error: message });
  }

  return sendError(res, {
    statusCode: error.statusCode || 500,
    error: error.message || 'Server Error',
  });
};

export default errorHandler;
