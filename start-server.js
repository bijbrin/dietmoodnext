#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

process.chdir('/home/bjadhs/.openclaw/workspace/diet-mood-next');

const port = process.env.PORT || 3001;

console.log(`Starting Next.js production server on port ${port}...`);

const next = spawn('npx', ['next', 'start', '-p', port.toString()], {
  stdio: 'inherit',
  env: { ...process.env, PORT: port.toString() }
});

next.on('close', (code) => {
  console.log(`Next.js server exited with code ${code}`);
  process.exit(code);
});
