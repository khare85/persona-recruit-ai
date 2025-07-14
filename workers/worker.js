/**
 * Background Worker Implementation
 * Processes memory-intensive jobs in isolated worker processes
 */

// Import the background job processing
const path = require('path');

// Ensure we can import TypeScript files in the worker
require('ts-node/register');

// Import our job processing functions
const { videoQueue, documentQueue, aiQueue } = require('../src/lib/backgroundJobs');

console.log(`[Worker ${process.pid}] Background job worker started`);

// Memory monitoring
let memoryStats = {
  lastCheck: new Date(),
  maxMemory: 0,
  currentMemory: 0
};

function updateMemoryStats() {
  const usage = process.memoryUsage();
  memoryStats.currentMemory = usage.rss;
  memoryStats.maxMemory = Math.max(memoryStats.maxMemory, usage.rss);
  memoryStats.lastCheck = new Date();
  
  return {
    rss: usage.rss,
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    external: usage.external,
    arrayBuffers: usage.arrayBuffers,
    rssMB: Math.round(usage.rss / 1024 / 1024),
    heapUsedMB: Math.round(usage.heapUsed / 1024 / 1024),
    pid: process.pid
  };
}

// Handle memory check requests from master
process.on('message', (msg) => {
  if (msg.type === 'memory-check') {
    const stats = updateMemoryStats();
    
    // Log if memory usage is high
    if (stats.rssMB > 1024) { // More than 1GB
      console.warn(`[Worker ${process.pid}] High memory usage: ${stats.rssMB}MB RSS, ${stats.heapUsedMB}MB heap`);
    }
    
    // Trigger garbage collection if available and memory is high
    if (global.gc && stats.rssMB > 800) { // More than 800MB
      global.gc();
      const afterGC = updateMemoryStats();
      console.log(`[Worker ${process.pid}] Garbage collection: ${stats.rssMB}MB -> ${afterGC.rssMB}MB`);
    }
  }
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error(`[Worker ${process.pid}] Uncaught exception:`, error);
  
  // Give some time for current jobs to finish, then exit
  setTimeout(() => {
    process.exit(1);
  }, 5000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`[Worker ${process.pid}] Unhandled rejection at:`, promise, 'reason:', reason);
});

// Periodic memory reporting
setInterval(() => {
  const stats = updateMemoryStats();
  
  // Only log if memory usage is significant
  if (stats.rssMB > 200) {
    console.log(`[Worker ${process.pid}] Memory: ${stats.rssMB}MB RSS, ${stats.heapUsedMB}MB heap`);
  }
}, 60000); // Every minute

// Log initial memory
setTimeout(() => {
  const stats = updateMemoryStats();
  console.log(`[Worker ${process.pid}] Initial memory: ${stats.rssMB}MB RSS, ${stats.heapUsedMB}MB heap`);
}, 1000);

console.log(`[Worker ${process.pid}] Job processing ready`);