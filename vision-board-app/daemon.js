#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const pidFile = 'vision-board.pid';
const logFile = 'vision-board.log';

// Kill existing process if running
if (fs.existsSync(pidFile)) {
  try {
    const oldPid = fs.readFileSync(pidFile, 'utf8').trim();
    process.kill(oldPid, 'SIGTERM');
    console.log(`Stopped previous Vision Board server (PID: ${oldPid})`);
  } catch (e) {
    // Process already dead
  }
  fs.unlinkSync(pidFile);
}

// Start new server process
const server = spawn('node', ['server/index.js'], {
  detached: true,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, PORT: '3001' }
});

// Write PID file
fs.writeFileSync(pidFile, server.pid.toString());

// Handle server output
const logStream = fs.createWriteStream(logFile, { flags: 'w' });
server.stdout.pipe(logStream);
server.stderr.pipe(logStream);

server.on('spawn', () => {
  console.log(`✅ Vision Board server started (PID: ${server.pid})`);
  console.log(`🔗 Access at: http://localhost:3001`);
  console.log(`📋 Logs: ${logFile}`);
});

server.on('error', (err) => {
  console.error(`❌ Failed to start server: ${err.message}`);
  process.exit(1);
});

// Detach from parent process
server.unref();

// Test server after startup delay
setTimeout(() => {
  import('http').then(http => {
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/health',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      if (res.statusCode === 200) {
        console.log(`Server health check passed`);
      } else {
        console.log(`Server responding but health check failed`);
      }
    });
    
    req.on('error', () => {
      console.log(`Server may still be starting up...`);
    });
    
    req.end();
  });
}, 3000);

process.exit(0);