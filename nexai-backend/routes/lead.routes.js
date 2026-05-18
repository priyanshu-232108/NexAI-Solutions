const express = require('express');
const rateLimit = require('express-rate-limit');
const { validateRequest } = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');
const {
  submitLead,
  getLeads,
  getLeadById,
  updateLeadStatus,
  deleteLead,
  getLeadStats,
  leadSubmitValidators,
  statusValidators,
  idValidator,
  paginationValidators
} = require('../controllers/lead.controller');

const router = express.Router();

const leadSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many submissions from this IP, please try again in an hour.',
    errors: ['Submission rate limit exceeded']
  }
});

router.post('/submit', leadSubmissionLimiter, leadSubmitValidators, validateRequest, submitLead);

router.use(protect);

router.get('/', paginationValidators, validateRequest, getLeads);
router.get('/stats', getLeadStats);
router.get('/:id', idValidator, validateRequest, getLeadById);
router.patch('/:id/status', idValidator, statusValidators, validateRequest, updateLeadStatus);
router.delete('/:id', idValidator, validateRequest, deleteLead);

module.exports = router;