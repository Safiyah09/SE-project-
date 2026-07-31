/**
 * ─────────────────────────────────────────────────────────────────────────────
 * seedAdmin.js — Creates the default admin user in MongoDB
 *
 * Usage:
 *   cd server
 *   node scripts/seedAdmin.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

// ── Admin credentials ─────────────────────────────────────────────────────────
const ADMIN = {
  name: 'Super Admin',
  email: 'admin@grocery.com',
  password: 'admin123',
  role: 'admin',
  isActive: true,
};

// ── Seed Function ─────────────────────────────────────────────────────────────
async function seedAdmin() {
  try {
    // 1. Connect to MongoDB
    console.log('\n📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // 2. Check if admin already exists
    const existing = await User.findOne({ email: ADMIN.email });

    if (existing) {
      console.log(`⚠️  Admin already exists:`);
      console.log(`   Name  : ${existing.name}`);
      console.log(`   Email : ${existing.email}`);
      console.log(`   Role  : ${existing.role}`);
      console.log('\n💡 If you want to reset the password, delete the user in MongoDB first.\n');
      process.exit(0);
    }

    // 3. Create admin user
    // Password will be hashed automatically by the User model pre-save hook
    const admin = await User.create({
      name: ADMIN.name,
      email: ADMIN.email,
      password: ADMIN.password,
      role: ADMIN.role,
      isActive: ADMIN.isActive,
    });

    // 5. Success output
    console.log('🎉 Admin user created successfully!\n');
    console.log('┌─────────────────────────────────────────┐');
    console.log('│           Admin Credentials              │');
    console.log('├─────────────────────────────────────────┤');
    console.log(`│  ID       : ${admin._id}      `);
    console.log(`│  Name     : ${ADMIN.name}               `);
    console.log(`│  Email    : ${ADMIN.email}       `);
    console.log(`│  Password : ${ADMIN.password} (plain text)  `);
    console.log(`│  Role     : ${ADMIN.role}                `);
    console.log('└─────────────────────────────────────────┘');
    console.log('\n⚠️  Change the password after first login!\n');

  } catch (error) {
    console.error('\n❌ Seed failed:', error.message);

    // Duplicate key error
    if (error.code === 11000) {
      console.error('   → Email already exists in the database.');
    }

  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected.\n');
    process.exit(0);
  }
}

seedAdmin();
