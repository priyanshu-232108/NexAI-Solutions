const express = require('express');
const { validateRequest } = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');
const {
  registerAdmin,
  loginAdmin,
  getCurrentAdmin,
  registerValidators,
  loginValidators
} = require('../controllers/auth.controller');

const router = express.Router();

router.post('/register', registerValidators, validateRequest, registerAdmin);
router.post('/login', loginValidators, validateRequest, loginAdmin);
router.get('/me', protect, getCurrentAdmin);

module.exports = router;