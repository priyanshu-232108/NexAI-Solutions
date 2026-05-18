const { v4: uuidv4 } = require('uuid');
const Groq = require('groq-sdk');
const ChatSession = require('../models/ChatSession');

const SYSTEM_PROMPT = `You are NexAI Assistant, the smart and friendly AI chatbot for NexAI Solutions — a full-service digital agency based in India serving global clients.

About NexAI Solutions:
- Founder & CEO: Priyanshu Kumar
- Team: 12 expert members across AI, development, design, and marketing
- Services: AI Development, Web Design & Development, Mobile Apps (Android/iOS/Flutter), Digital Marketing, SEO, Video Editing, Content Writing, Social Media Management, Translation & Data Services
- Clients: Global (India + International)
- Response time: Within 24 hours
- Pricing: Custom quotes based on project scope

Your behavior rules:
1. Welcome visitors warmly and professionally
2. Answer questions about NexAI services, team, and capabilities
3. Help visitors identify which service fits their needs by asking smart questions
4. Collect visitor name and email naturally during conversation — ask politely, never force
5. Always encourage filling the contact form for detailed quotes
6. For pricing questions: say quotes are project-specific, encourage form submission
7. Keep replies short: max 3-4 sentences, conversational tone
8. Respond in visitor's language — Hindi or English (auto-detect)
9. If unsure about something, say: 'Let me connect you with our team!'
10. Never invent prices, timelines, or team details

Remember: Your goal is to convert visitors into leads.`;

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

async function sendMessage(req, res) {
  try {
    const { sessionId: incomingSessionId, message, visitorName } = req.body;
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    if (!message || String(message).trim().length === 0) {
      return sendError(res, 400, 'Message is required', ['Please provide a message']);
    }

    let session;
    let sessionId = incomingSessionId;

    if (!sessionId) {
      sessionId = uuidv4();
      session = new ChatSession({
        sessionId,
        ipAddress: clientIp,
        visitorName: visitorName || undefined
      });
      await session.save();
    } else {
      session = await ChatSession.findOne({ sessionId });
      if (!session) {
        return sendError(res, 404, 'Session not found', ['Invalid session ID']);
      }
      if (visitorName && !session.visitorName) {
        session.visitorName = visitorName;
      }
    }

    const userMessage = String(message).trim();

    session.messages.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    });

    // Build messages for Groq API
    const messages = [
      ...session.messages.slice(-10).map((msg) => ({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.content
      }))
    ];

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    let aiReply;
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          ...messages
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.7,
        max_tokens: 1024
      });
      aiReply = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    } catch (groqError) {
      if (groqError.status === 429) {
        return sendError(res, 503, 'Our AI is busy, please try again in a moment!', ['Rate limit exceeded']);
      }
      throw groqError;
    }

    session.messages.push({
      role: 'model',
      content: aiReply,
      timestamp: new Date()
    });

    await session.save();

    return sendSuccess(res, 200, 'Message processed successfully', {
      sessionId,
      reply: aiReply,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] sendMessage error:`, error.message);
    return sendError(res, 500, 'Unable to process message', ['Internal server error']);
  }
}

async function getChatSessions(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const [total, sessions] = await Promise.all([
      ChatSession.countDocuments(),
      ChatSession.find().sort({ createdAt: -1 }).skip(skip).limit(limit)
    ]);

    return sendSuccess(res, 200, 'Chat sessions retrieved successfully', {
      sessions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] getChatSessions error:`, error.message);
    return sendError(res, 500, 'Unable to fetch chat sessions', ['Internal server error']);
  }
}

module.exports = {
  sendMessage,
  getChatSessions
};
