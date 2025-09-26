import prisma from "@/lib/prisma";
import geoip from "geoip-lite";
import { nanoid } from "nanoid";

interface SessionRequest {
  headers: { [key: string]: string | string[] | undefined };
  ip?: string | undefined;
}

const SESSION_TTL_DAYS = parseInt(process.env.SESSION_TTL_DAYS || "30");

/**
 * Extract IP address from request, handling various proxy scenarios
 */
function extractIp(req: SessionRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    const firstIp = forwarded.split(",")[0];
    return firstIp?.trim() || "";
  }
  if (Array.isArray(forwarded)) {
    return forwarded[0] || "";
  }
  return req.ip || "";
}

/**
 * Create or update a session for a user
 */

export async function createSession(userId: string, req: SessionRequest) {
  if (!userId) throw new Error("User ID is required");

  const userAgent = Array.isArray(req.headers["user-agent"])
    ? req.headers["user-agent"][0] || ""
    : req.headers["user-agent"] || "";
  const ip = extractIp(req);
  const geo = ip ? geoip.lookup(ip) : null;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);

  const existing = await prisma.session.findFirst({
    where: {
      userId,
      userAgent,
      ip: ip || null,
      isActive: true,
    },
  });

  if (existing) {
    return prisma.session.update({
      where: { id: existing.id },
      data: {
        lastActive: new Date(),
        expiresAt,
        city: geo?.city || existing.city,
        region: geo?.region || existing.region,
        country: geo?.country || existing.country,
      },
    });
  }

  return prisma.session.create({
    data: {
      id: nanoid(),
      userId,
      userAgent,
      ip: ip || null,
      city: geo?.city || null,
      region: geo?.region || null,
      country: geo?.country || null,
      expiresAt,
    },
  });
}
