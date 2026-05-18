const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const leadRoutes = require('./routes/lead.routes');
const chatRoutes = require('./routes/chat.routes');

const app = express();
const PORT = process.env.PORT || 5000;
const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';

function logEvent(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: frontendOrigin,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    errors: ['Rate limit exceeded']
  }
});

app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'NexAI backend is running',
    data: { status: 'ok', timestamp: new Date().toISOString() }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/chat', chatRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    errors: ['The requested resource does not exist']
  });
});

app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Unhandled error:`, err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    errors: ['An unexpected error occurred']
  });
});

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logEvent(`NexAI API server listening on port ${PORT}`);
      logEvent(`Allowed frontend origin: ${frontendOrigin}`);
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Server startup failed:`, error.message);
    process.exit(1);
  }
}

startServer();