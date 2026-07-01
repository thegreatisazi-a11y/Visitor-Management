const express = require('express');
const authController = require('../controllers/authController');
const { protectAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { loginSchema, forgotPasswordSchema } = require('../validators/authValidators');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/logout', protectAdmin, authController.logout);
router.get('/me', protectAdmin, authController.me);

module.exports = router;
