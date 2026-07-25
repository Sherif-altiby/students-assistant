import { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/AppError';

/**
 * Restricts a route to the given roles. Must run *after* `authenticate`,
 * since it relies on req.user.role being set.
 *
 * Usage: router.post('/doctors/invite', authenticate, authorize('ADMIN'), ...)
 */
export const authorize =
  (...allowedRoles: string[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }


    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError('You do not have permission to perform this action');
    }

    next();
  };
