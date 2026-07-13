const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authMiddleware, authController.logout);
router.put('/avatar', authMiddleware, authController.updateAvatar);
router.put('/profile', authMiddleware, authController.updateProfile);

module.exports = router;
