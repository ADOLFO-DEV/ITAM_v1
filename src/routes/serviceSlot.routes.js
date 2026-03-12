const express = require('express');
const router = express.Router();
const serviceSlotController = require('../controllers/serviceSlot.controller');

router.get('/', serviceSlotController.getAllServiceSlots);
router.post('/', serviceSlotController.createServiceSlot);
router.put('/:id', serviceSlotController.updateServiceSlot);
router.patch('/:id', serviceSlotController.patchServiceSlot);
router.delete('/:id', serviceSlotController.deleteServiceSlot);

module.exports = router;
