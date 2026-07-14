import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../utils/AppError';
import { jwtService } from '../utils/Jwt';

const BEARER_PREFIX = 'Bearer ';

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  let token: string | undefined;

  const header = req.headers.authorization;

  // Try Authorization header first
  if (header?.startsWith(BEARER_PREFIX)) {
    token = header.slice(BEARER_PREFIX.length);
  }

  // Fallback to cookie
  if (!token) {
    token = req.cookies?.refreshToken;
  }

  if (!token) {
    throw new UnauthorizedError(
      'Missing Authorization header or refreshToken cookie'
    );
  }

  const payload = jwtService.verifyAccessToken(token);

  req.user = {
    id: payload.sub,
    email: payload.email,
  };

  next();
};