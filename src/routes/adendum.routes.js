const express = require("express");
const router = express.Router();
const multer = require("multer");
const adendumController = require("../controllers/adendum.controller");

const upload = multer({ storage: multer.memoryStorage() });

router.post("/sync", upload.single("file"), adendumController.syncAdendum);
router.post("/confirm", adendumController.confirmReconciliation);

module.exports = router;
