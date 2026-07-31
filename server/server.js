// Load environment variables FIRST before any other imports
require('dotenv').config();
require('colors');

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// ── Route Imports ─────────────────────────────────────────────────────────────
const authRoutes    = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes   = require('./routes/orderRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
//const dashboardRoutes = require('./routes/dashboardRoutes');

// ── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

// ── Initialize Express ────────────────────────────────────────────────────────
const app = express();

// ── Global Middleware ─────────────────────────────────────────────────────────

// CORS — allow requests from frontend origin
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logger (dev only)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Health Check Route ────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🛒 Grocery Inventory API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/categories', categoryRoutes);
//app.use('/api/dashboard', dashboardRoutes);

// ── Error Handling Middleware ─────────────────────────────────────────────────
// Must be registered AFTER all routes
app.use(notFound);
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(
    `\n🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  );
  console.log(`📡 API Base URL: http://localhost:${PORT}/api`.cyan);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`.cyan);
});

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  server.close(() => {
    console.log('🛑 Server shutting down due to unhandled promise rejection.'.red.bold);
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err.message.red.bold);
  server.close(() => {
    console.log('🛑 Server shutting down due to uncaught exception.'.red.bold);
    process.exit(1);
  });
});

// Handle SIGTERM (e.g. from Docker/Heroku)
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received. Shutting down gracefully...'.yellow);
  server.close(() => {
    console.log('✅ Process terminated.'.green);
  });
});

module.exports = app;
