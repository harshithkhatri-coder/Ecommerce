module.exports = (req, res) => {
  res.status(200).json({
    message: "Backend is running",
    status: "ok"
  });
};
