// src/auth/services/sessionService.ts
import prisma from "@/lib/prisma";
import { parse } from "useragent";
import geoip from "geoip-lite";
import { nanoid } from "nanoid";

interface SessionRequest {
  headers: { [key: string]: string | string[] | undefined };
  ip?: string | undefined;
}

interface CreateSessionOptions {
  trackLocation?: boolean;
}

type DeviceType = "MOBILE" | "DESKTOP" | "TABLET";

export class SessionService {
  /**
   * Extract IP address from request, handling various proxy scenarios
   */
  private static extractIp(req: SessionRequest): string {
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
   * Parse user agent to extract device information
   */
  private static parseUserAgent(userAgent: string) {
    const agent = parse(userAgent);

    // Determine device type
    let deviceType: DeviceType = "DESKTOP";
    if (agent.device?.family) {
      const deviceFamily = agent.device.family.toLowerCase();
      if (deviceFamily.includes("ipad") || deviceFamily.includes("tablet")) {
        deviceType = "TABLET";
      } else if (
        deviceFamily.includes("iphone") ||
        deviceFamily.includes("mobile")
      ) {
        deviceType = "MOBILE";
      }
    }

    return {
      deviceType,
      deviceName: agent.device?.family || "Unknown Device",
      browser: agent.family || "Unknown Browser",
      browserVersion: agent.major || "",
      os: agent.os?.family || "Unknown OS",
      osVersion: agent.os?.major || "",
    };
  }

  /**
   * Create a new session with comprehensive tracking
   */
  static async createSession(
    userId: string,
    req: SessionRequest,
    expiresAt: Date,
    options: CreateSessionOptions = { trackLocation: true }
  ) {
    // Input validation
    if (!userId) {
      throw new Error("User ID is required");
    }
    if (!expiresAt || expiresAt <= new Date()) {
      throw new Error("Invalid expiration date - must be in the future");
    }

    try {
      const sessionId = nanoid();
      const userAgent = Array.isArray(req.headers["user-agent"])
        ? req.headers["user-agent"][0] || ""
        : req.headers["user-agent"] || "";
      const ip = this.extractIp(req);
      const geo = options.trackLocation && ip ? geoip.lookup(ip) : null;

      return await prisma.session.create({
        data: {
          id: sessionId,
          userId,
          userAgent,
          ip: ip || null,
          city: geo?.city || null,
          region: geo?.region || null,
          country: geo?.country || null,
          expiresAt,
        },
      });
    } catch (error) {
      console.error("Failed to create session:", error);
      throw new Error("Session creation failed");
    }
  }

  /**
   * Update the last active timestamp for a session
   */
  static async updateLastActive(sessionId: string) {
    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    try {
      return await prisma.session.update({
        where: { id: sessionId },
        data: { lastActive: new Date() },
      });
    } catch (error) {
      console.error("Failed to update last active:", error);
      throw new Error("Failed to update session activity");
    }
  }

  /**
   * Revoke a specific session
   */
  static async revokeSession(sessionId: string) {
    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    try {
      return await prisma.session.update({
        where: { id: sessionId },
        data: { isActive: false },
      });
    } catch (error) {
      console.error("Failed to revoke session:", error);
      throw new Error("Session revocation failed");
    }
  }

  /**
   * Revoke all sessions for a user except the current one
   */
  static async revokeAllOtherSessions(
    userId: string,
    currentSessionId: string
  ) {
    if (!userId) {
      throw new Error("User ID is required");
    }
    if (!currentSessionId) {
      throw new Error("Current session ID is required");
    }

    try {
      return await prisma.session.updateMany({
        where: {
          userId,
          isActive: true,
          NOT: { id: currentSessionId },
        },
        data: {
          isActive: false,
        },
      });
    } catch (error) {
      console.error("Failed to revoke other sessions:", error);
      throw new Error("Failed to revoke other sessions");
    }
  }

  /**
   * Clean up expired sessions (mark as inactive)
   */
  static async cleanupExpiredSessions() {
    try {
      return await prisma.session.updateMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });
    } catch (error) {
      console.error("Failed to cleanup expired sessions:", error);
      throw new Error("Session cleanup failed");
    }
  }

  /**
   * Get all active sessions for a user with parsed device info
   */
  static async getUserSessions(userId: string) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    try {
      const sessions = await prisma.session.findMany({
        where: {
          userId,
          isActive: true,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          lastActive: "desc",
        },
        select: {
          id: true,
          userAgent: true,
          city: true,
          region: true,
          country: true,
          createdAt: true,
          lastActive: true,
          // Exclude IP for security
        },
      });

      // Parse user agent for each session
      return sessions.map((session) => {
        const parsed = this.parseUserAgent(session.userAgent || "");
        return {
          ...session,
          ...parsed,
        };
      });
    } catch (error) {
      console.error("Failed to get user sessions:", error);
      throw new Error("Failed to retrieve user sessions");
    }
  }

  /**
   * Check if a session is valid and not expired
   */
  static async isValidSession(sessionId: string): Promise<boolean> {
    if (!sessionId) {
      return false;
    }

    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        select: {
          expiresAt: true,
          isActive: true,
        },
      });

      return session
        ? session.isActive && session.expiresAt > new Date()
        : false;
    } catch (error) {
      console.error("Failed to validate session:", error);
      return false;
    }
  }

  /**
   * Get session details by ID with parsed device info
   */
  static async getSession(sessionId: string) {
    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              displayName: true,
            },
          },
        },
      });

      if (!session) return null;

      const parsed = this.parseUserAgent(session.userAgent || "");

      return {
        ...session,
        ...parsed,
      };
    } catch (error) {
      console.error("Failed to get session:", error);
      throw new Error("Failed to retrieve session");
    }
  }

  /**
   * Validate session user agent for security checks
   */
  static async validateSessionUserAgent(
    sessionId: string,
    currentUserAgent: string
  ): Promise<boolean> {
    if (!sessionId || !currentUserAgent) {
      return false;
    }

    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        select: { userAgent: true, isActive: true, expiresAt: true },
      });

      if (!session || !session.isActive || session.expiresAt <= new Date()) {
        return false;
      }

      // Parse both user agents for comparison
      const storedParsed = this.parseUserAgent(session.userAgent || "");
      const currentParsed = this.parseUserAgent(currentUserAgent);

      // Compare key components (allow for minor version differences)
      return (
        storedParsed.browser === currentParsed.browser &&
        storedParsed.os === currentParsed.os &&
        storedParsed.deviceType === currentParsed.deviceType
      );
    } catch (error) {
      console.error("Failed to validate session user agent:", error);
      return false;
    }
  }
}
