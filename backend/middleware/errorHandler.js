export default (err, req, res, next) => {
  console.error('Error:', err && err.stack ? err.stack : err);

  // Multer file size limit
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: err.message || 'File too large' });
  }

  // Multer generic
  if (err && err.name === 'MulterError') {
    return res.status(400).json({ message: err.message || 'File upload error' });
  }

  // Mongoose validation
  if (err && err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }

  res.status(500).json({ message: err.message || 'Server Error' });
};
