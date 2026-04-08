const { ZodError } = require('zod');

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message
      }))
    });
  }

  // Handle Prisma connection or query errors generically or specifically
  if (err.code && err.code.startsWith('P2')) {
    return res.status(400).json({
      success: false,
      message: 'Database operation failed',
      code: err.code
    });
  }

  // Fallback for unexpected errors
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
