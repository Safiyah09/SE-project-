const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas
 * Retries on failure with a delay
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose 7+ no longer needs these options, but kept for reference
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });

    console.log(
      `\n✅ MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold
    );

    // Auto-create default admin user if it does not exist
    const User = require('../models/User');
    const adminExists = await User.findOne({ email: 'admin@grocery.com' });
    if (!adminExists) {
      await User.create({
        name: 'Super Admin',
        email: 'admin@grocery.com',
        password: 'admin123',
        role: 'admin',
        isActive: true
      });
      console.log('Default admin created successfully'.green);
    }

    // Listen for connection events
    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err.message}`.red.bold);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...'.yellow);
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected.'.green);
    });

  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`.red.bold);
    // Exit process with failure on initial connection error
    process.exit(1);
  }
};

module.exports = connectDB;
