const { body, param, query } = require('express-validator');
const Lead = require('../models/Lead');
const { sendEmail, buildAdminLeadEmail, buildUserReplyEmail } = require('../utils/sendEmail');

const serviceMap = {
  'AI Development': 'AI Development',
  'Web Design & Development': 'Web Design',
  'Web Design': 'Web Design',
  'Mobile App Development': 'Mobile App',
  'Mobile App': 'Mobile App',
  'Digital Marketing': 'Digital Marketing',
  'SEO': 'SEO',
  'Video Editing': 'Video Editing',
  'Content Writing': 'Content Writing',
  'Social Media Management': 'Social Media',
  'Social Media': 'Social Media',
  'Translation & Data Services': 'Translation',
  'Translation': 'Translation',
  'Other': 'Other'
};

function normalizeService(service) {
  return serviceMap[service] || 'Other';
}

function sendSuccess(res, status, message, data) {
  return res.status(status).json({
    success: true,
    message,
    data
  });
}

function sendError(res, status, message, errors = []) {
  return res.status(status).json({
    success: false,
    message,
    errors
  });
}

async function submitLead(req, res) {
  try {
    const { name, email, service, message } = req.body;
    const normalizedService = normalizeService(service);

    const lead = await Lead.create({
      name,
      email: email.toLowerCase(),
      service: normalizedService,
      message,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
    });

    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;

    if (adminEmail) {
      try {
        const adminMail = buildAdminLeadEmail(lead);
        await sendEmail({ to: adminEmail, ...adminMail });
      } catch (emailError) {
        console.error(`[${new Date().toISOString()}] Admin email failed:`, emailError.message);
      }

      try {
        const userMail = buildUserReplyEmail(lead);
        await sendEmail({ to: lead.email, ...userMail });
      } catch (emailError) {
        console.error(`[${new Date().toISOString()}] Auto-reply email failed:`, emailError.message);
      }
    }

    return sendSuccess(res, 201, 'Lead submitted successfully', { lead });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] submitLead error:`, error.message);
    return sendError(res, 500, 'Unable to submit lead', ['Internal server error']);
  }
}

async function getLeads(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const [total, leads] = await Promise.all([
      Lead.countDocuments(),
      Lead.find().sort({ createdAt: -1 }).skip(skip).limit(limit)
    ]);

    return sendSuccess(res, 200, 'Leads retrieved successfully', {
      leads,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] getLeads error:`, error.message);
    return sendError(res, 500, 'Unable to fetch leads', ['Internal server error']);
  }
}

async function getLeadById(req, res) {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return sendError(res, 404, 'Lead not found', ['No lead exists with this ID']);
    }

    return sendSuccess(res, 200, 'Lead retrieved successfully', { lead });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] getLeadById error:`, error.message);
    return sendError(res, 500, 'Unable to fetch lead', ['Internal server error']);
  }
}

async function updateLeadStatus(req, res) {
  try {
    const { status } = req.body;
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!lead) {
      return sendError(res, 404, 'Lead not found', ['No lead exists with this ID']);
    }

    return sendSuccess(res, 200, 'Lead status updated successfully', { lead });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] updateLeadStatus error:`, error.message);
    return sendError(res, 500, 'Unable to update lead status', ['Internal server error']);
  }
}

async function deleteLead(req, res) {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);

    if (!lead) {
      return sendError(res, 404, 'Lead not found', ['No lead exists with this ID']);
    }

    return sendSuccess(res, 200, 'Lead deleted successfully', { lead });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] deleteLead error:`, error.message);
    return sendError(res, 500, 'Unable to delete lead', ['Internal server error']);
  }
}

async function getLeadStats(req, res) {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [total, newToday, converted] = await Promise.all([
      Lead.countDocuments(),
      Lead.countDocuments({ createdAt: { $gte: todayStart } }),
      Lead.countDocuments({ status: 'converted' })
    ]);

    const conversionRate = total === 0 ? 0 : Number(((converted / total) * 100).toFixed(2));

    return sendSuccess(res, 200, 'Lead stats retrieved successfully', {
      totalLeads: total,
      newToday,
      convertedLeads: converted,
      conversionRate
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] getLeadStats error:`, error.message);
    return sendError(res, 500, 'Unable to fetch lead stats', ['Internal server error']);
  }
}

const leadSubmitValidators = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
  body('email').trim().isEmail().withMessage('A valid email address is required').normalizeEmail(),
  body('service')
    .trim()
    .isIn(Object.keys(serviceMap))
    .withMessage('Please choose a valid service option'),
  body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters long')
];

const statusValidators = [
  body('status')
    .trim()
    .isIn(['new', 'contacted', 'converted', 'closed'])
    .withMessage('Status must be new, contacted, converted, or closed')
];

const idValidator = [
  param('id').isMongoId().withMessage('Invalid lead ID')
];

const paginationValidators = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

module.exports = {
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
};