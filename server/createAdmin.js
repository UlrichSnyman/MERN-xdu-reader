#!/usr/bin/env node

const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createAdminUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/literary-works-test');
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const admin = new User({
      username: 'admin',
      password: 'admin123',
      role: 'admin'
    });

    await admin.save();
    console.log('Admin user created successfully');
    console.log('Username: admin');
    console.log('Password: admin123');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();