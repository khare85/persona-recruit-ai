#!/bin/bash
# Quick server restart script

echo "🔄 Restarting development server..."

# Kill existing server processes
pkill -f "next dev" 2>/dev/null || true
pkill -f "node.*next" 2>/dev/null || true

# Wait a moment for processes to terminate
sleep 2

echo "🧹 Cleaning up temporary files..."
rm -f /tmp/server.log

echo "🚀 Starting server with optimized settings..."
NODE_OPTIONS="--max-old-space-size=8192 --expose-gc" npm run dev > /tmp/server.log 2>&1 &

echo "⏳ Waiting for server to start..."
sleep 10

# Check if server is running
if curl -s http://localhost:9002/api/health > /dev/null 2>&1; then
    echo "✅ Server is running successfully!"
    echo "🌐 Server: https://9002-firebase-studio-1749940755362.cluster-6dx7corvpngoivimwvvljgokdw.cloudworkstations.dev"
    echo "📊 Health: http://localhost:9002/api/health (local check)"
    
    # Show memory usage
    MEMORY_USAGE=$(curl -s http://localhost:9002/api/health | jq -r '.system.memory.percentage // "N/A"')
    echo "🧠 Memory Usage: ${MEMORY_USAGE}%"
else
    echo "❌ Server failed to start. Check logs:"
    echo "   tail -f /tmp/server.log"
fi

echo "📝 To view logs: tail -f /tmp/server.log"
echo "🔧 To stop server: pkill -f 'next dev'"