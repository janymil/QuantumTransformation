import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import visionBoardRoutes from './routes/vision-board-routes.js';

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

// Vision Board API Routes
app.use('/api/vb', visionBoardRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Vision Board App is running', port: PORT });
});

// Serve static files and React app
app.use(express.static(path.join(__dirname, '../client')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎨 Vision Board App server running on port ${PORT}`);
  console.log(`🔗 API available at http://localhost:${PORT}/api/vb`);
});