const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const serviceSlotRoutes = require("./routes/serviceSlot.routes");
const statsRoutes = require("./routes/stats.routes");
const authRoutes = require("./routes/auth.routes");
const authMiddleware = require("./middlewares/authMiddleware");

app.use("/api/auth", authRoutes);
app.use("/api/slots", authMiddleware, serviceSlotRoutes);
app.use("/api/stats", authMiddleware, statsRoutes);

// Health Check
app.get("/", (req, res) => {
  res.send("API Online");
});

// Use Global Error Handler (Must be after routes)
const errorHandler = require("./middlewares/errorHandler");
app.use(errorHandler);

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
