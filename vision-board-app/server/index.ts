import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
// import { createServer } from 'vite';

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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Vision Board App is running', port: PORT });
});

// Basic API endpoints for testing
app.get('/api/vb/status', (req, res) => {
  res.json({ status: 'Vision Board API is working', timestamp: new Date().toISOString() });
});

// Mock endpoints for development
app.get('/api/vb/vision-boards', (req, res) => {
  res.json([]);
});

app.post('/api/vb/ai/suggest-life-areas', (req, res) => {
  res.json({ 
    suggestions: [
      { area: 'health', confidence: 0.9, reason: 'Based on your wellness goals' },
      { area: 'career', confidence: 0.8, reason: 'Based on your professional aspirations' },
      { area: 'relationships', confidence: 0.7, reason: 'Based on your social connections' }
    ]
  });
});

// Development server setup
if (process.env.NODE_ENV === 'development') {
  const vite = await createServer({
    server: { middlewareMode: true },
    root: path.join(__dirname, '../client'),
    appType: 'spa'
  });
  
  app.use(vite.ssrFixStacktrace);
  app.use(vite.middlewares);
} else {
  // Production: serve built files
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎨 Vision Board App server running on port ${PORT}`);
  console.log(`🔗 Access the app at http://localhost:${PORT}`);
  console.log(`📁 Serving from: ${process.env.NODE_ENV === 'development' ? 'client' : 'dist'}`);
});