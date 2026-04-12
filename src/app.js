const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve Static Frontend Files
app.use(express.static(path.join(__dirname, "public")));

// Routes
const serviceSlotRoutes = require("./routes/serviceSlot.routes");
const statsRoutes = require("./routes/stats.routes");
const authRoutes = require("./routes/auth.routes");
const auditRoutes = require("./routes/audit.routes");
const employeeRoutes = require("./routes/employee.routes");
const userRoutes = require("./routes/user.routes");
const authMiddleware = require("./middlewares/authMiddleware");

app.use("/api/auth", authRoutes);
app.use("/api/slots", authMiddleware, serviceSlotRoutes);
app.use("/api/stats", authMiddleware, statsRoutes);
app.use("/api/logs", authMiddleware, auditRoutes);
app.use("/api/employees", authMiddleware, employeeRoutes);
app.use("/api/users", authMiddleware, userRoutes);

// Health Check for Render
app.get("/api/health", (req, res) => {
  res.send("API Online");
});

// Catch-all Route for Vue Router (History Mode)
app.get(/(.*)/, (req, res, next) => {
  // Ignorar rutas que empiecen con /api para que pasen al errorHandler si no fueron capturadas
  if (req.originalUrl.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
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
