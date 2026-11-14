const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.name = err.name;
  error.statusCode = err.statusCode || 500;

  // Log error for debugging in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error Detail]', {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
  }

  // 1. Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Invalid format for field '${err.path}': '${err.value}'`;
    error.statusCode = 400;
    return res.status(error.statusCode).json({
      success: false,
      error: {
        type: 'CastError',
        message
      }
    });
  }

  // 2. Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    const message = `Duplicate value '${value}' entered for unique field '${field}'. Please use another value.`;
    error.statusCode = 409;
    return res.status(error.statusCode).json({
      success: false,
      error: {
        type: 'DuplicateFieldError',
        field,
        message
      }
    });
  }

  // 3. Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors || {}).map((el) => ({
      field: el.path,
      message: el.message
    }));
    error.statusCode = 400;
    return res.status(error.statusCode).json({
      success: false,
      error: {
        type: 'ValidationError',
        message: 'Validation failed on one or more fields',
        details: errors
      }
    });
  }

  // 4. Malformed JSON Body Error (SyntaxError from express.json())
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        type: 'SyntaxError',
        message: 'Malformed JSON payload in request body'
      }
    });
  }

  // Generic/Operational Error Response
  res.status(error.statusCode).json({
    success: false,
    error: {
      type: err.name || 'ServerError',
      message: error.message || 'Internal Server Error'
    }
  });
};

module.exports = errorHandler;
