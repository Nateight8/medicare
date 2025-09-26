import prisma from "@/lib/prisma";
import { parse } from "useragent";
import { GraphqlContext } from "../context";

export const sessionResolvers = {
  Query: {
    async getUserSessions(_: unknown, __: unknown, context: GraphqlContext) {
      const { user, req } = context;

      if (!user?.id) {
        throw new Error("User ID is required");
      }

      try {
        // Get the current request's IP and user agent to identify the current session
        const userAgent = req?.headers["user-agent"] || "";
        const ip = req?.ip || req?.socket?.remoteAddress || "";

        console.log("Current request IP:", ip);
        console.log("Current user agent:", userAgent);

        const sessions = await prisma.session.findMany({
          where: {
            userId: user.id,
            isActive: true,
          },
          orderBy: {
            lastActive: "desc",
          },
          select: {
            id: true,
            ip: true,
            userAgent: true,
            city: true,
            region: true,
            country: true,
            createdAt: true,
            lastActive: true,
            expiresAt: true,
          },
        });

        // Enrich with parsed UA + mark current device
        console.log(
          "Found sessions:",
          sessions.map((s) => ({
            id: s.id,
            userAgent: s.userAgent?.substring(0, 50),
          }))
        );
        return sessions.map((session) => {
          const agent = parse(session.userAgent || "");

          let deviceType: "DESKTOP" | "MOBILE" | "TABLET" = "DESKTOP";
          const family = agent.device?.family?.toLowerCase() || "";
          if (family.includes("ipad") || family.includes("tablet")) {
            deviceType = "TABLET";
          } else if (
            family.includes("iphone") ||
            family.includes("android") ||
            family.includes("mobile")
          ) {
            deviceType = "MOBILE";
          }

          return {
            id: session.id,
            ip: session.ip || null,
            city: session.city || null,
            region: session.region || null,
            country: session.country || null,
            createdAt: session.createdAt.toISOString(),
            lastActive: session.lastActive.toISOString(),
            expiresAt: session.expiresAt.toISOString(),
            deviceType,
            deviceName: agent.device?.family || "Unknown Device",
            browser: agent.family || "Unknown Browser",
            browserVersion: agent.major || "Unknown",
            os: agent.os?.family || "Unknown OS",
            osVersion: agent.os?.major || "Unknown",

            isCurrentDevice: session.ip === ip, // <==Mark as current device if IP match
          };
        });
      } catch (error) {
        console.error("Failed to fetch sessions:", error);
        throw new Error("Unable to retrieve sessions");
      }
    },
  },
};
