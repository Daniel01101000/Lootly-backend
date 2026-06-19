const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  const logData = {
    statusCode,
    message: err.message,
    isOperational: !!err.isOperational,
    timestamp: new Date().toISOString(),
  };

  if (!err.isOperational) {
    logData.stack = err.stack;
    console.error('[ERROR]', JSON.stringify(logData, null, 2));
  } else {
    console.error(`[ERROR] ${statusCode}: ${err.message}`);
  }

  if (statusCode === 500 && !err.isOperational) {
    console.error('[ERROR] Unhandled error stack:', err.stack);
  }

  try {
    const responseBody = {
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && err.stack ? { stack: err.stack } : {}),
    };

    return res.status(statusCode).json(responseBody);
  } catch (sendErr) {
    console.error('[ERROR] Failed to send error response:', sendErr.message);
    console.error('[ERROR] Original error:', err.message);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
};

module.exports = { errorHandler };
