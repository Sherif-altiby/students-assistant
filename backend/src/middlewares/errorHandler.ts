import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { env } from '../config/env';

interface ErrorResponseBody {
  status: 'error';
  message: string;
  errors?: unknown;
  stack?: string;
}

/**
 * Translates known error types (validation, Prisma, operational AppErrors)
 * into consistent, client-safe HTTP responses. Anything unrecognized is
 * logged in full but returned to the client as a generic 500 so internals
 * are never leaked.
 */
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof ZodError) {
  const body: ErrorResponseBody = {
    status: 'error',
    message: 'Validation failed',
    errors: err.issues.map((issue) => ({
      field: issue.path.at(-1),
      message: issue.message,
    })),
  };

  res.status(400).json(body);
  return;
}

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const { statusCode, message } = mapPrismaError(err);
    res.status(statusCode).json({ status: 'error', message });
    return;
  }

  if (err instanceof AppError) {
    const body: ErrorResponseBody = { status: 'error', message: err.message };
    if (env.isDevelopment) body.stack = err.stack;
    res.status(err.statusCode).json(body);
    return;
  }

  // Unexpected/programming error: log full detail, expose nothing.
  logger.error('Unhandled error', err);
  const body: ErrorResponseBody = {
    status: 'error',
    message: 'Internal server error',
  };
  if (env.isDevelopment && err instanceof Error) body.stack = err.stack;
  res.status(500).json(body);
};

function mapPrismaError(err: Prisma.PrismaClientKnownRequestError): {
  statusCode: number;
  message: string;
} {
  switch (err.code) {
    case 'P2002': {
      const target = (err.meta?.['target'] as string[] | undefined)?.join(', ');
      return { statusCode: 409, message: `Duplicate value for: ${target ?? 'unique field'}` };
    }
    case 'P2025':
      return { statusCode: 404, message: 'Record not found' };
    case 'P2003':
      return { statusCode: 400, message: 'Invalid reference to related record' };
    default:
      console.error('Unhandled Prisma error', err);
      return { statusCode: 500, message: 'Database error' };
  }
}
