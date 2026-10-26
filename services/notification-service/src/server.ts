import { app, pool } from './app';

const port = parseInt(process.env.PORT || '5001', 10);

const server = app.listen(port, () => {
  console.log(`====================================================`);
  console.log(` GearBids Notification Service running on port ${port}`);
  console.log(` Health check available at: http://localhost:${port}/health`);
  console.log(` SSE Stream endpoint: http://localhost:${port}/stream?userId=<id>`);
  console.log(`====================================================`);
});

const shutdown = async () => {
  console.log('Notification Service shutting down...');
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
