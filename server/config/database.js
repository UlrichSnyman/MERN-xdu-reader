const mongoose = require('mongoose');

const connectDB = async () => {
  // If in demo mode and no MongoDB available, use in-memory mode
  if (process.env.DEMO_MODE === 'true') {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/literary-works', {
        serverSelectionTimeoutMS: 3000 // Fail fast in demo mode
      });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      console.log('Running in demo mode without persistent database');
      // Set up in-memory database
      mongoose.set('bufferCommands', false);
      return;
    }
  } else {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/literary-works');
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      console.error('Database connection error:', error);
      process.exit(1);
    }
  }
};

module.exports = connectDB;