// Load environment variables first
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Verify environment variable is loaded
console.log('📋 Environment check:');
console.log('  FRONTEND_URL from env:', process.env.FRONTEND_URL || 'NOT SET');

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// Import routes
const tableRoutes = require('./routes/tableRoutes');
const orderRoutes = require('./routes/orderRoutes');
const printerRoutes = require('./routes/printerRoutes');
const qrRoutes = require('./routes/qrRoutes');
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const refundRoutes = require('./routes/refundRoutes');
const reportRoutes = require('./routes/reportRoutes');
const productRoutes = require('./routes/productRoutes');
const customerAuthRoutes = require('./routes/customerAuthRoutes');
const topupRoutes = require('./routes/topupRoutes');
const wastageRoutes = require('./routes/wastageRoutes');
const auditTrailRoutes = require('./routes/auditTrailRoutes');
const adminMessagesRoutes = require('./routes/adminMessagesRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Import services
const SocketService = require('./services/socketService');
const PrinterService = require('./services/printerService');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
// Get FRONTEND_URL from environment, remove trailing slash if present
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://192.168.0.106:3000').replace(/\/$/, '');
console.log('🌐 Frontend URL configured:', FRONTEND_URL);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize services
const socketService = new SocketService(io);
const printerService = new PrinterService(io);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CafeFlow Backend API is running',
    timestamp: Date.now(),
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'CafeFlow Backend API is running',
    timestamp: Date.now(),
  });
});

// Debug endpoint to check environment variables
app.get('/api/debug/env', (req, res) => {
  res.json({
    success: true,
    data: {
      FRONTEND_URL: process.env.FRONTEND_URL || 'NOT SET',
      BACKEND_PORT: process.env.BACKEND_PORT || 'NOT SET',
      BACKEND_IP: process.env.BACKEND_IP || 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'NOT SET',
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/printer', printerRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/refunds', refundRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customer-auth', customerAuthRoutes);
app.use('/api/topup', topupRoutes);
app.use('/api/wastage', wastageRoutes);
app.use('/api/audit-trail', auditTrailRoutes);
app.use('/api/admin-messages', adminMessagesRoutes);
app.use('/api/payments', paymentRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

const PORT = process.env.BACKEND_PORT || 4000;

// Initialize database on startup
const setupDatabase = require('./config/setupDatabase');
// Note: initDatabase.js is a standalone script, not required here

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - log and continue
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Don't exit - log and continue
});

// Start server
server.listen(PORT, '0.0.0.0', async () => {
  const BACKEND_IP = process.env.BACKEND_IP || '192.168.0.106';
  console.log(`🚀 CafeFlow Backend Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server initialized`);
  console.log(`🔗 API: http://${BACKEND_IP}:${PORT}/api`);
  console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
  
  // Initialize database (only creates tables if they don't exist)
  try {
    await setupDatabase();
    const seedData = require('./scripts/seedData');
    await seedData();
    console.log('✅ Database initialized with seed data');
  } catch (error) {
    console.error('⚠️  Database initialization error:', error.message);
    console.error('⚠️  Stack:', error.stack);
    // Don't exit - server should continue running even if seeding fails
  }
  
  // Set up periodic session cleanup (every hour)
  const authController = require('./controllers/authController');
  setInterval(async () => {
    try {
      await authController.cleanupExpiredSessions();
      console.log('🧹 Cleaned up expired sessions');
    } catch (error) {
      console.error('⚠️  Error cleaning up sessions:', error.message);
    }
  }, 60 * 60 * 1000); // Every hour
  
  console.log('✅ Server is ready to accept connections');
  console.log('✅ Server will continue running - press Ctrl+C to stop');
});

// Keep the process alive
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };
