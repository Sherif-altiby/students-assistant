import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { logger } from './utils/logger';
import { initSocket } from './socket';

const start = async (): Promise<void> => {
  await prisma.$connect();
  logger.info('Database connected');

  const app = createApp();
  const httpServer = http.createServer(app);

  const io = initSocket(httpServer);

  httpServer.listen(env.port, () => {
    logger.info(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received: shutting down gracefully`);

    io.close(); // stops accepting new socket connections, closes existing ones

    httpServer.close(async () => {
      await prisma.$disconnect();
      logger.info('Shutdown complete');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', reason);
    throw reason;
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', err);
    process.exit(1);
  });
};

start().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});