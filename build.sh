#!/bin/bash
set -e

echo "Starting build process..."
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Install dependencies
echo "Installing dependencies..."
npm ci --legacy-peer-deps

# Build the application
echo "Building application..."
NODE_OPTIONS='--max-old-space-size=8192' npm run build

echo "Build completed successfully!"