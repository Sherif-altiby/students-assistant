// src/socket/index.ts
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { registerChatHandlers } from '../modules/chat/chat.socket';

interface AccessTokenPayload {
  userId: string;
}

interface AccessTokenPayload {
  sub: string;
  email: string;
}

let io: Server | undefined;

export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: { origin: env.corsOrigin, credentials: true },
  });

 


io.use((socket: Socket, next) => {
  try {
    const token = extractToken(socket);
    if (!token) return next(new Error('Authentication token missing'));

    const payload = jwt.verify(token, env.jwt.accessSecret) as AccessTokenPayload;
    socket.data.userId = payload.sub; // was payload.userId
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
});

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} (user ${socket.data.userId})`);

    registerChatHandlers(io as Server, socket);

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

// Access token can arrive either as an explicit auth payload (mobile/native
// clients) or as a bearer header (web clients reusing the same interceptor
// as REST calls). Refresh tokens are cookie-only and never touch sockets.
function extractToken(socket: Socket): string | undefined {
  const fromAuth = socket.handshake.auth?.token as string | undefined;
  if (fromAuth) return fromAuth;

  const authHeader = socket.handshake.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);

  return undefined;
}