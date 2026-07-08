import { createApp } from './app.js';
import { config } from './config/env.js';
import { prisma } from './lib/prisma.js';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`API server running on http://localhost:${config.port}`);
  console.log(`Swagger docs:        http://localhost:${config.port}/api-docs`);
});

async function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
