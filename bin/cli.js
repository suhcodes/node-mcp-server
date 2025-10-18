#!/usr/bin/env node

/**
 * CLI wrapper for node-mcp-server
 *
 * This wrapper ensures the server runs correctly with Yarn PnP
 * by delegating to yarn node when in a Yarn workspace
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverPath = join(__dirname, '..', 'dist', 'server.js');

// Check if we're in a Yarn PnP environment
const isPnP = existsSync(join(__dirname, '..', '.pnp.cjs'));

if (isPnP) {
  // Use yarn node to run the server (works with PnP)
  const yarn = spawn('yarn', ['node', serverPath], {
    cwd: join(__dirname, '..'),
    stdio: 'inherit',
    env: process.env,
  });

  yarn.on('error', (error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });

  yarn.on('exit', (code) => {
    process.exit(code || 0);
  });
} else {
  // Standard node_modules installation, run directly
  const node = spawn('node', [serverPath], {
    cwd: join(__dirname, '..'),
    stdio: 'inherit',
    env: process.env,
  });

  node.on('error', (error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });

  node.on('exit', (code) => {
    process.exit(code || 0);
  });
}
