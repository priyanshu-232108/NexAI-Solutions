const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: [true, 'Session ID is required'],
      unique: true,
      index: true
    },
    messages: [
      {
        role: {
          type: String,
          enum: ['user', 'model'],
          required: true
        },
        content: {
          type: String,
          required: true
        },
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ],
    visitorName: {
      type: String,
      trim: true,
      maxlength: 120
    },
    visitorEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]*@[^\s@]*$/, 'Invalid email format']
    },
    ipAddress: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

chatSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
