#!/usr/bin/env node
/**
 * Server stability monitoring script
 * Monitors the development server and restarts if it becomes unhealthy
 */

const { spawn } = require('child_process');
const fetch = require('node-fetch');

const SERVER_URL = 'http://localhost:9002';
const HEALTH_ENDPOINT = `${SERVER_URL}/api/health`;
const CHECK_INTERVAL = 30000; // 30 seconds
const MAX_FAILURES = 3;

let failureCount = 0;
let serverProcess = null;

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function startServer() {
  log('Starting development server...');
  
  serverProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: '--max-old-space-size=8192 --expose-gc'
    }
  });

  serverProcess.on('exit', (code) => {
    log(`Server process exited with code ${code}`);
    if (code !== 0) {
      log('Server crashed, restarting in 5 seconds...');
      setTimeout(startServer, 5000);
    }
  });

  serverProcess.on('error', (error) => {
    log(`Server process error: ${error.message}`);
  });
}

async function checkHealth() {
  try {
    const response = await fetch(HEALTH_ENDPOINT, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Server-Monitor'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    
    const health = await response.json();
    
    // Check if server is healthy
    if (health.status === 'healthy') {
      failureCount = 0;
      log('Server health check: HEALTHY');
    } else if (health.status === 'degraded') {
      failureCount = 0;
      log('Server health check: DEGRADED (but stable)');
    } else {
      failureCount++;
      log(`Server health check: UNHEALTHY (failures: ${failureCount}/${MAX_FAILURES})`);
      
      if (failureCount >= MAX_FAILURES) {
        log('Server is unhealthy, restarting...');
        restartServer();
      }
    }
    
    // Log memory usage
    if (health.system && health.system.memory) {
      const memUsage = health.system.memory.percentage;
      if (memUsage > 90) {
        log(`WARNING: High memory usage: ${memUsage.toFixed(1)}%`);
      }
    }
    
  } catch (error) {
    failureCount++;
    log(`Health check failed: ${error.message} (failures: ${failureCount}/${MAX_FAILURES})`);
    
    if (failureCount >= MAX_FAILURES) {
      log('Health check failed too many times, restarting server...');
      restartServer();
    }
  }
}

function restartServer() {
  if (serverProcess) {
    log('Stopping current server process...');
    serverProcess.kill('SIGTERM');
    
    setTimeout(() => {
      if (serverProcess && !serverProcess.killed) {
        log('Force killing server process...');
        serverProcess.kill('SIGKILL');
      }
    }, 5000);
  }
  
  failureCount = 0;
  setTimeout(startServer, 3000);
}

function setupGracefulShutdown() {
  process.on('SIGTERM', () => {
    log('Received SIGTERM, shutting down gracefully...');
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    log('Received SIGINT, shutting down gracefully...');
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }
    process.exit(0);
  });
}

// Main execution
function main() {
  log('Starting server stability monitor...');
  
  setupGracefulShutdown();
  startServer();
  
  // Wait for server to start before beginning health checks
  setTimeout(() => {
    log('Beginning health checks...');
    checkHealth(); // Initial check
    setInterval(checkHealth, CHECK_INTERVAL);
  }, 15000);
}

main();