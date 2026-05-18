const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address']
    },
    service: {
      type: String,
      enum: ['AI Development', 'Web Design', 'Mobile App', 'Digital Marketing', 'SEO', 'Video Editing', 'Content Writing', 'Social Media', 'Translation', 'Other'],
      required: [true, 'Service is required']
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      minlength: 10,
      maxlength: 4000,
      trim: true
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'converted', 'closed'],
      default: 'new'
    },
    ipAddress: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lead', leadSchema);