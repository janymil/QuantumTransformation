const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

// Basic middleware
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Vision Board running', port: PORT });
});

// API endpoint
app.get('/api/vb/status', (req, res) => {
  res.json({ message: 'Vision Board API operational' });
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Vision Board server running on port ${PORT}`);
  console.log(`Access at: http://localhost:${PORT}`);
});

// Keep alive
setInterval(() => {
  console.log(`Server alive: ${new Date().toISOString()}`);
}, 30000);