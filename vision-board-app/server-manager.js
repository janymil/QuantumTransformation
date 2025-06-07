#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';

const PORT = 3001;
const PID_FILE = 'vision-board.pid';

// Function to start the server
function startServer() {
  console.log('Starting Vision Board server...');
  
  const server = spawn('node', ['persistent-server.js'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    detached: false
  });
  
  // Write PID
  fs.writeFileSync(PID_FILE, server.pid.toString());
  
  server.on('error', (err) => {
    console.error('Server error:', err);
    setTimeout(startServer, 5000); // Restart after 5 seconds
  });
  
  server.on('exit', (code) => {
    console.log(`Server exited with code ${code}`);
    if (code !== 0) {
      setTimeout(startServer, 5000); // Restart if crashed
    }
  });
  
  return server;
}

// Kill existing process
if (fs.existsSync(PID_FILE)) {
  try {
    const oldPid = fs.readFileSync(PID_FILE, 'utf8').trim();
    process.kill(oldPid, 'SIGTERM');
    console.log(`Killed previous server (PID: ${oldPid})`);
  } catch (e) {
    // Process already dead
  }
  fs.unlinkSync(PID_FILE);
}

// Start server
const serverProcess = startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down server manager...');
  serverProcess.kill();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Shutting down server manager...');
  serverProcess.kill();
  process.exit(0);
});