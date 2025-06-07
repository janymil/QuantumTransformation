import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Vision Board App is running', port: PORT });
});

// API status endpoint
app.get('/api/vb/status', (req, res) => {
  res.json({ status: 'Vision Board API is working', timestamp: new Date().toISOString() });
});

// Serve the main app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎨 Vision Board App server running on port ${PORT}`);
  console.log(`🔗 Access at http://localhost:${PORT}`);
});