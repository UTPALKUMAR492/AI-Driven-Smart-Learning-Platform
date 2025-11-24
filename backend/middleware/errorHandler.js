module.exports = (err, req, res, next) => {
  console.log("Error:", err);
  res.status(500).json({ message: err.message || "Server Error" });
};
