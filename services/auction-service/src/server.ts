import { app } from './app';
import { config } from './config/env';
import { pool } from './config/db';

const server = app.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(` GearBids Auction Service running on port ${config.port}`);
  console.log(` Environment: ${config.nodeEnv}`);
  console.log(` Target Database: ${config.db.host}:${config.db.port}/${config.db.database}`);
  console.log(` Health check available at: http://localhost:${config.port}/health`);
  console.log(`====================================================`);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('Received termination signal. Shutting down gracefully...');
  server.close(async () => {
    console.log('HTTP server closed.');
    await pool.end();
    console.log('PostgreSQL pool drained.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
