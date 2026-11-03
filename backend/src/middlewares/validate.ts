import { NextFunction, Request, Response } from 'express';
import { z, ZodType } from 'zod';

const validatedRequests = new WeakMap<Request, { schema: ZodType; data: unknown }>();

export function getValidatedRequest<T extends ZodType>(req: Request, schema: T): z.infer<T> {
  const validated = validatedRequests.get(req);
  if (!validated || validated.schema !== schema) {
    throw new Error('Request validation middleware did not run for this schema');
  }
  return validated.data as z.infer<T>;
}

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
    validatedRequests.set(req, { schema, data: parsed });

    if (parsed.body !== undefined) req.body = parsed.body;
    if (parsed.params !== undefined) req.params = parsed.params as typeof req.params;
    next();
  };
