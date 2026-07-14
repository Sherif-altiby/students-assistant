import express, { Application, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { StatusCodes } from 'http-status-codes';
import { env } from './config/env';
import { apiRouter } from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { notFoundHandler } from './middlewares/notFoundHandler';

export const createApp = (): Application => {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS
  app.use(cors({ origin: env.corsOrigin, credentials: true }));

  // Body/cookie parsing
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Request logging
  app.use(morgan(env.isDevelopment ? 'dev' : 'combined'));

  // Health check (useful for load balancers / uptime checks / Docker healthchecks)
  app.get('/health', (_req: Request, res: Response) => {
    res.status(StatusCodes.OK).json({ status: 'ok', uptime: process.uptime() });
  });

  // API routes
  app.use('/api/v1', apiRouter);

  // 404 + centralized error handling (must be registered last)
  app.use(notFoundHandler);
  app.use((err: unknown, req: Request, res: Response, next: NextFunction) =>
    errorHandler(err, req, res, next)
  );

  return app;
};
