#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3001', 'http://localhost:5000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Vision Board App is running', 
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// API endpoints
app.get('/api/vb/status', (req, res) => {
  res.json({ 
    message: 'Vision Board API is operational',
    version: '1.0.0',
    features: ['vision-boards', 'affirmations', 'daily-rituals']
  });
});

app.post('/api/vb/suggestions', (req, res) => {
  res.json({
    suggestions: [
      { area: 'career', confidence: 0.9, reason: 'Based on your professional goals' },
      { area: 'health', confidence: 0.8, reason: 'Aligned with your wellness journey' },
      { area: 'relationships', confidence: 0.7, reason: 'Based on your social connections' }
    ]
  });
});

// Serve static files from dist
app.use(express.static(path.join(__dirname, 'dist')));

// Serve React app for all other routes
app.get('*', (req, res) => {
  const htmlPath = path.join(__dirname, 'dist/index.html');
  res.sendFile(htmlPath);
});

// Start server with proper error handling
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎨 Vision Board App server running on port ${PORT}`);
  console.log(`🔗 Access the app at http://localhost:${PORT}`);
  console.log(`📁 Serving from: dist directory`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

// Error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  console.error('Server will continue running...');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('Server will continue running...');
});

// Keep alive with heartbeat
setInterval(() => {
  console.log(`[${new Date().toISOString()}] Vision Board server heartbeat - Active connections: ${server.listening ? 'Yes' : 'No'}`);
}, 30000);

// Server error handling
server.on('error', (err) => {
  console.error('Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  }
});

export default server;