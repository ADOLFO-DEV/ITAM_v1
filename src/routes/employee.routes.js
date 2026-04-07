const express = require("express");
const router = express.Router();
const multer = require("multer");
const employeeController = require("../controllers/employee.controller");

// Setup multer for in-memory file storage
const upload = multer({ storage: multer.memoryStorage() });

// Sincronización de Headcount
router.post("/sync", upload.single("file"), employeeController.syncHeadcount);
router.get("/", employeeController.getAllEmployees);

module.exports = router;
