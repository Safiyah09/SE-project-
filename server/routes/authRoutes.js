const express = require('express');
const { body } = require('express-validator');
const { login, getMe, logout, verifyToken } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// ── Validation Rules ──────────────────────────────────────────────────────────
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

// ── Public Routes ─────────────────────────────────────────────────────────────
// POST /api/auth/login
router.post('/login', loginValidation, login);

// ── Protected Routes ──────────────────────────────────────────────────────────
// GET  /api/auth/me
router.get('/me', protect, getMe);

// POST /api/auth/logout
router.post('/logout', protect, logout);

// GET  /api/auth/verify
router.get('/verify', protect, verifyToken);

module.exports = router;
