const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*', // Allow all origins for development ease, configure in production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static uploads/reports if any
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/reports', express.static(path.join(__dirname, 'reports')));

// Simple Health Check
app.get('/health', async (req, res) => {
  const db = require('./config/db');
  let errMessage = null;
  try {
    // Run a quick check query to initialize connection and test state
    await db.query('SELECT 1');
  } catch (err) {
    console.error('Health check DB query failed:', err.message);
    errMessage = err.message;
  }
  const dbStatus = db.getDbStatus ? db.getDbStatus() : 'unknown';
  res.json({ 
    status: 'OK', 
    message: 'Express backend is online',
    database: dbStatus,
    error: errMessage
  });
});

// Register routers
app.use('/api/auth', authRoutes);
app.use('/api', predictionRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

// Start the server if not imported as a serverless module
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Express server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
