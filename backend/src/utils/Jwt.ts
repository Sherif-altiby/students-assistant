import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError } from './AppError';

export interface AuthTokenPayload extends JwtPayload {
  sub: string; // user id
  email: string;
}

/**
 * Access and refresh tokens are signed with separate secrets so a leaked
 * access token (short-lived, sent on every request) can never be replayed
 * as a refresh token (long-lived, only sent to /auth/refresh).
 */
export const jwtService = {
  signAccessToken(payload: { id: string; email: string }): string {
    return jwt.sign({ sub: payload.id, email: payload.email }, env.jwt.accessSecret, {
      expiresIn: env.jwt.accessExpiresIn as SignOptions['expiresIn'],
    });
  },

  signRefreshToken(payload: { id: string; email: string }): string {
    return jwt.sign({ sub: payload.id, email: payload.email }, env.jwt.refreshSecret, {
      expiresIn: env.jwt.refreshExpiresIn as SignOptions['expiresIn'],
    });
  },

  verifyAccessToken(token: string): AuthTokenPayload {
    try {
      return jwt.verify(token, env.jwt.accessSecret) as AuthTokenPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired access token');
    }
  },

  verifyRefreshToken(token: string): AuthTokenPayload {
    try {
      return jwt.verify(token, env.jwt.refreshSecret) as AuthTokenPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  },
};