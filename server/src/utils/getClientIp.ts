// utils/getClientIp.ts
import type { IncomingMessage } from "http";

export function getClientIp(req: IncomingMessage & { ip?: string }): string {
  const forwarded = req.headers["x-forwarded-for"];

  let ip: string | undefined;

  if (forwarded) {
    ip = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    ip = ip?.split(",")[0]?.trim();
  } else if (req.ip) {
    ip = req.ip;
  } else if (req.socket?.remoteAddress) {
    ip = req.socket.remoteAddress;
  }

  return ip ?? ""; // <- guarantee string return
}
