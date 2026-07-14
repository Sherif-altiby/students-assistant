/**
 * Augments Express's Request type so `req.user` is known wherever the
 * `authenticate` middleware runs, without resorting to `any` casts in
 * every controller that needs it.
 */
declare namespace Express {
  export interface Request {
    user?: {
      id: string;
      email: string;
    };
  }
}