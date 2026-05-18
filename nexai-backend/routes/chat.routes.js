const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, query } = require('express-validator');
const { validateRequest } = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');
const { sendMessage, getChatSessions } = require('../controllers/chat.controller');

const router = express.Router();

const chatMessageLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many messages from this IP, please try again later.',
    errors: ['Message rate limit exceeded']
  }
});

const sendMessageValidators = [
  body('sessionId').optional().isUUID().withMessage('Invalid session ID format'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('visitorName').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters')
];

const paginationValidators = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

router.post('/message', chatMessageLimiter, sendMessageValidators, validateRequest, sendMessage);
router.get('/sessions', protect, paginationValidators, validateRequest, getChatSessions);

module.exports = router;
