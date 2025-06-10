import express, { type Request, Response, NextFunction } from "express";
import fileUpload from "express-fileupload";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Add CORS headers for cross-domain requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// File upload middleware for audio transcription
app.use(fileUpload({
  createParentPath: true,
  limits: { 
    fileSize: 20 * 1024 * 1024 // 20MB limit for audio files
  },
  abortOnLimit: false,
  responseOnLimit: "File size limit has been reached",
  limitHandler: false,
  preserveExtension: true,
  safeFileNames: true,
  parseNested: true
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  console.log('=== REGISTERING ROUTES ===');
  
  // Register main routes FIRST to set up authentication
  console.log('Registering main routes...');
  const server = await registerRoutes(app);
  console.log('Main routes registered');

  // Therapeutic chat routes are now handled in main routes to prevent auth conflicts
  console.log('Therapeutic chat routes handled in main routes');

  // Add route debugging middleware
  app.use((req, res, next) => {
    if (req.path.includes('/api/therapeutic-chat')) {
      console.log(`=== THERAPEUTIC CHAT ROUTE: ${req.method} ${req.path} ===`);
      console.log('Headers:', req.headers);
      console.log('User:', req.user ? 'authenticated' : 'not authenticated');
    }
    next();
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();