const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      type: 'NotFound',
      message: `Cannot find endpoint ${req.method} ${req.originalUrl}`
    }
  });
};

module.exports = notFound;
