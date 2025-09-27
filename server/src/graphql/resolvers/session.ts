import prisma from "@/lib/prisma";
import { parse } from "useragent";
import { GraphqlContext } from "../context";
import { RevokeSessionsArgs } from "../typedefs/sessions";
import { Prisma, Session } from "@prisma/client";

type SelectedSession = Prisma.SessionGetPayload<{
  select: {
    id: true;
    ip: true;
    userAgent: true;
    city: true;
    region: true;
    country: true;
    createdAt: true;
    lastActive: true;
    expiresAt: true;
  };
}>;

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

        const sessions: SelectedSession[] = await prisma.session.findMany({
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
            userId: true,
            isActive: true,
          },
        });

        // Enrich with parsed UA + mark current device

        return sessions.map((session: SelectedSession) => {
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
  Mutation: {
    revokeSessions: async (
      _: unknown,
      args: RevokeSessionsArgs,
      ctx: GraphqlContext
    ) => {
      const { user, prisma, req } = ctx;

      // const currentSessionId = req?.headers["session-id"];

      if (!user?.id) throw new Error("User not authenticated");
      if (!args.sessionIds || args.sessionIds.length === 0)
        throw new Error("Provide session IDs to revoke");

      try {
        const result = await prisma.session.updateMany({
          where: {
            userId: user.id,
            id: { in: args.sessionIds },
            isActive: true,
            // NOT: { id: currentSessionId }, // always exclude current session
          },
          data: { isActive: false },
        });

        return {
          success: true,
          revokedCount: result.count,
        };
      } catch (error) {
        console.error("Failed to revoke sessions:", error);
        return { success: false, revokedCount: 0 };
      }
    },
  },
};
