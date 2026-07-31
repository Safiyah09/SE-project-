/**
 * @desc    Global error handling middleware
 *          Catches errors thrown anywhere in the app via next(error)
 *          Must be registered LAST in server.js after all routes
 */
const errorHandler = (err, req, res, next) => {
  // Log the full error stack in development
  if (process.env.NODE_ENV === 'development') {
    console.error('💥 Error:', err.stack);
  } else {
    console.error('💥 Error:', err.message);
  }

  let statusCode = err.statusCode || res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Internal Server Error';

  // ── Mongoose Specific Errors ──────────────────────────────────────────────

  // Bad ObjectId (e.g., /api/products/not-an-id)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = `Resource not found. Invalid ID: ${err.value}`;
  }

  // Duplicate key violation (e.g., unique email already exists)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    statusCode = 400;
    message = `Duplicate field value: '${value}' already exists for '${field}'. Please use a different value.`;
  }

  // Mongoose validation errors (e.g., required fields missing)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // ── JWT Errors ────────────────────────────────────────────────────────────

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please log in again.';
  }

  // ── Send Response ─────────────────────────────────────────────────────────

  res.status(statusCode).json({
    success: false,
    message,
    // Include stack trace only in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * @desc    404 Not Found handler
 *          Catches requests to undefined routes
 *          Register BEFORE errorHandler but AFTER all routes
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = { errorHandler, notFound };
