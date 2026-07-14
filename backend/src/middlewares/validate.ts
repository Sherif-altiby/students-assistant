import { NextFunction, Request, Response } from 'express';
import { ZodType } from 'zod';

/**
 * Validates req.body/query/params against a Zod schema and replaces
 * body/params with the parsed (and type-coerced) result. Throws ZodError on
 * failure, which the global error handler turns into a 400 response.
 */
export const validate =
  (schema: ZodType) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    }) as { body?: unknown; query?: unknown; params?: unknown };

    if (parsed.body !== undefined) req.body = parsed.body;
    if (parsed.params !== undefined) req.params = parsed.params as typeof req.params;
    next();
  };
