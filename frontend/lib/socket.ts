import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "@/store/useAuthStore";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? process.env.NEXT_PUBLIC_API_URL;

let socket: Socket | null = null;

/**
 * Lazily creates a single shared socket connection, authenticated with the
 * current access token. Call getSocket() from client components/hooks only.
 */
export function getSocket(): Socket {
  if (socket) return socket;

  const { accessToken } = useAuthStore.getState();

  socket = io(SOCKET_URL, {
    withCredentials: true,
    autoConnect: false,
    auth: { token: accessToken },
  });

  return socket;
}

/** Re-reads the latest access token before (re)connecting — needed after a refresh. */
export function connectSocket(): Socket {
  const s = getSocket();
  const { accessToken } = useAuthStore.getState();
  s.auth = { token: accessToken };

  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket(): void {
  socket?.disconnect();
}