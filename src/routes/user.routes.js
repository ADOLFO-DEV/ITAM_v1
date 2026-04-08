const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// All routes here will be protected by authMiddleware defined in app.js
router.get('/', userController.getAllUsers);
router.patch('/:id/role', userController.updateUserRole);
router.delete('/:id', userController.deleteUser);

module.exports = router;
