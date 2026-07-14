import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { authService } from './auth.service';
import { userService } from '../user/user.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { env } from '../../config/env';
import { UnauthorizedError } from '../../utils/AppError';

const REFRESH_COOKIE_NAME = 'refreshToken';

/**
 * Access token: returned in the JSON body, kept in memory by the client,
 * attached as `Authorization: Bearer <token>`.
 *
 * Refresh token: set as an httpOnly cookie so it's inaccessible to
 * JavaScript (mitigates XSS token theft) and never touches client storage.
 */
const setRefreshCookie = (res: Response, token: string): void => {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'strict',
    maxAge: env.cookies.refreshMaxAgeMs,
    path: '/api/v1/auth', // only sent back to auth endpoints, not the whole app
  });
};

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const { user, accessToken, refreshToken } = await authService.register(req.body);
    setRefreshCookie(res, refreshToken);
    res.status(StatusCodes.CREATED).json({ status: 'success', data: { user, accessToken } });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { user, accessToken, refreshToken } = await authService.login(req.body);
    setRefreshCookie(res, refreshToken);
    res.status(StatusCodes.OK).json({ status: 'success', data: { user, accessToken } });
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    if (!token) {
      throw new UnauthorizedError('Missing refresh token');
    }

    const { accessToken, refreshToken } = await authService.refresh(token);
    setRefreshCookie(res, refreshToken); // rotate: old refresh token is now stale
    res.status(StatusCodes.OK).json({ status: 'success', data: { accessToken } });
  }),

  logout: asyncHandler(async (_req: Request, res: Response) => {
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
    res.status(StatusCodes.NO_CONTENT).send();
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    // `authenticate` middleware guarantees req.user is set before this runs.
    const user = await userService.getUserById(req.user!.id);
    res.status(StatusCodes.OK).json({ status: 'success', data: user });
  }),
};