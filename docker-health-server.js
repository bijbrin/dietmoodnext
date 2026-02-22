#!/usr/bin/env node
/**
 * Lightweight health check server for Docker
 * Runs on port 3008 and proxies to the main app's health endpoint
 */

const http = require('http');

const HEALTH_PORT = process.env.HEALTH_PORT || 3008;
const MAIN_APP_PORT = process.env.PORT || 3001;

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/health' || req.url === '/') {
    try {
      // Check main app health
      const healthCheck = await new Promise((resolve, reject) => {
        const request = http.get(`http://localhost:${MAIN_APP_PORT}/api/health`, (response) => {
          let data = '';
          response.on('data', chunk => data += chunk);
          response.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              resolve({ status: 'unknown', raw: data });
            }
          });
        });
        request.on('error', reject);
        request.setTimeout(5000, () => {
          request.destroy();
          reject(new Error('Timeout'));
        });
      });

      res.writeHead(200);
      res.end(JSON.stringify({
        ...healthCheck,
        healthPort: HEALTH_PORT,
        mainAppPort: MAIN_APP_PORT
      }, null, 2));
    } catch (error) {
      res.writeHead(503);
      res.end(JSON.stringify({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
        healthPort: HEALTH_PORT,
        mainAppPort: MAIN_APP_PORT
      }, null, 2));
    }
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(HEALTH_PORT, '0.0.0.0', () => {
  console.log(`[Health Server] Running on http://0.0.0.0:${HEALTH_PORT}`);
  console.log(`[Health Server] Proxying to main app on port ${MAIN_APP_PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Health Server] SIGTERM received, shutting down...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('[Health Server] SIGINT received, shutting down...');
  server.close(() => process.exit(0));
});
