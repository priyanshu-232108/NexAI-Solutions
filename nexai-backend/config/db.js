const mongoose = require('mongoose');

mongoose.set('strictQuery', true);
mongoose.set('sanitizeFilter', true);

async function connectDB() {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    throw new Error('MONGO_URI is not configured');
  }

  await mongoose.connect(mongoURI);
  console.log(`[${new Date().toISOString()}] MongoDB connected`);
}

module.exports = connectDB;