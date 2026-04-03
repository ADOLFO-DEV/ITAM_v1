const express = require('express');
const router = express.Router();
const serviceSlotController = require('../controllers/serviceSlot.controller');
const auditController = require('../controllers/audit.controller');

router.get('/', serviceSlotController.getAllServiceSlots);
router.post('/', serviceSlotController.createServiceSlot);
router.get('/:id/logs', auditController.getSlotLogs); // Endpoint para historial de un activo
router.put('/:id', serviceSlotController.updateServiceSlot);
router.patch('/:id', serviceSlotController.patchServiceSlot);
router.delete('/:id', serviceSlotController.deleteServiceSlot);

module.exports = router;
