const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../models/User');

function createToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

function authResponse(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  };
}

async function registerAdmin(req, res) {
  try {
    const existingAdmin = await User.countDocuments();

    if (existingAdmin > 0) {
      return res.status(403).json({
        success: false,
        message: 'Admin registration is disabled after the first setup',
        errors: ['An admin account already exists']
      });
    }

    const { name, email, password } = req.body;

    const user = await User.create({ name, email, password });

    const token = createToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      data: {
        user: authResponse(user),
        token
      }
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] registerAdmin error:`, error.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to create admin account',
      errors: ['Internal server error']
    });
  }
}

async function loginAdmin(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        errors: ['Email or password is incorrect']
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        errors: ['Email or password is incorrect']
      });
    }

    const token = createToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: authResponse(user),
        token
      }
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] loginAdmin error:`, error.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to log in',
      errors: ['Internal server error']
    });
  }
}

async function getCurrentAdmin(req, res) {
  try {
    return res.status(200).json({
      success: true,
      message: 'Current admin retrieved successfully',
      data: { user: authResponse(req.user) }
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] getCurrentAdmin error:`, error.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch admin profile',
      errors: ['Internal server error']
    });
  }
}

const registerValidators = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
  body('email').trim().isEmail().withMessage('A valid email address is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
];

const loginValidators = [
  body('email').trim().isEmail().withMessage('A valid email address is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

module.exports = {
  registerAdmin,
  loginAdmin,
  getCurrentAdmin,
  registerValidators,
  loginValidators
};