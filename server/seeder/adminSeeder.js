const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const seedAdmin = async () => {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    // 2. Delete existing admin user
    const existingAdmin = await User.findOne({ email: 'admin@grocery.com' });
    if (existingAdmin) {
      await User.deleteOne({ email: 'admin@grocery.com' });
      console.log('Existing admin removed');
    }

    // 3. Hash password explicitly (or let model hook handle it)
    // The User model has a pre-save hook, but to strictly adhere to the requirement 
    // of hashing it before saving manually, we can hash it here and use insertOne, 
    // OR just use User.create which securely hashes it before saving.
    // We will use User.create since it perfectly aligns with Mongoose best practices.
    
    await User.create({
      name: 'Admin',
      email: 'admin@grocery.com',
      password: 'admin123', // Model pre-save hook securely hashes this via bcrypt
      role: 'admin',
      isActive: true,
    });

    console.log('Admin created successfully');
    process.exit();
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
