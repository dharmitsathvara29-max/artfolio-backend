module.exports = (err, req, res, next) => {
  let status = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'CastError')       { status = 400; message = `Invalid ID: ${err.value}`; }
  if (err.code === 11000)              { status = 400; message = `Duplicate value for: ${Object.keys(err.keyValue || {})[0]}`; }
  if (err.name === 'ValidationError') { status = 400; message = Object.values(err.errors).map(e => e.message).join(', '); }
  if (err.name === 'MulterError')     { status = 400; message = err.code === 'LIMIT_FILE_SIZE' ? 'Max file size is 5MB' : err.message; }

  res.status(status).json({ success: false, message });
};
