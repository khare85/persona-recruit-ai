/**
 * Worker Process Entry Point
 * Manages background job workers for memory-intensive operations
 */

const cluster = require('cluster');
const os = require('os');

// Configuration
const MAX_WORKERS = Math.min(os.cpus().length, 4); // Limit to 4 workers max
const RESTART_DELAY = 5000; // 5 seconds delay before restarting failed workers

if (cluster.isMaster || cluster.isPrimary) {
  console.log(`[Workers] Master ${process.pid} starting ${MAX_WORKERS} workers...`);
  
  // Fork workers
  for (let i = 0; i < MAX_WORKERS; i++) {
    forkWorker(i);
  }
  
  // Handle worker exits
  cluster.on('exit', (worker, code, signal) => {
    console.log(`[Workers] Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
    
    // Restart worker after delay unless shutdown
    if (!worker.exitedAfterDisconnect) {
      console.log(`[Workers] Restarting worker in ${RESTART_DELAY}ms...`);
      setTimeout(() => {
        forkWorker();
      }, RESTART_DELAY);
    }
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('[Workers] Master received SIGTERM, shutting down workers...');
    cluster.disconnect(() => {
      console.log('[Workers] All workers disconnected');
      process.exit(0);
    });
  });
  
  process.on('SIGINT', () => {
    console.log('[Workers] Master received SIGINT, shutting down workers...');
    cluster.disconnect(() => {
      console.log('[Workers] All workers disconnected');
      process.exit(0);
    });
  });
  
} else {
  // Worker process
  console.log(`[Workers] Worker ${process.pid} started`);
  
  // Start the actual worker
  require('./worker.js');
  
  // Handle shutdown gracefully
  process.on('SIGTERM', () => {
    console.log(`[Workers] Worker ${process.pid} received SIGTERM, shutting down...`);
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    console.log(`[Workers] Worker ${process.pid} received SIGINT, shutting down...`);
    process.exit(0);
  });
}

function forkWorker(id = null) {
  const worker = cluster.fork();
  console.log(`[Workers] Started worker ${worker.process.pid}${id !== null ? ` (ID: ${id})` : ''}`);
  
  // Monitor worker memory usage
  setInterval(() => {
    if (worker.isDead()) return;
    
    try {
      worker.send({ type: 'memory-check' });
    } catch (error) {
      console.error(`[Workers] Failed to send memory check to worker ${worker.process.pid}:`, error.message);
    }
  }, 30000); // Check every 30 seconds
  
  return worker;
}