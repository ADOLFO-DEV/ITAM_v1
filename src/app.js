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

app.use("/api/slots", serviceSlotRoutes);

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
