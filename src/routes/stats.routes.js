const express = require('express');
const router = express.Router();
const serviceSlotController = require('../controllers/serviceSlot.controller');

router.get('/', serviceSlotController.getDashboardStats);

module.exports = router;
