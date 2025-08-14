import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";

import { typeDefs } from "./typedefs";
import { resolvers } from "./resolvers";
import { createContext } from "./context";
import { JWTTokenService } from "@/auth/services/tokenService";
import { config } from "@/config";
import prisma from "@/lib/prisma";

// import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "@/auth/routes/authRoutes";

export async function createServer() {
  const app = express();
  const httpServer = http.createServer(app);

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  // Mount auth routes under /api prefix
  app.use("/api", authRoutes);

  const tokenService = new JWTTokenService(config);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    formatError: (error) => {
      console.error("GraphQL Error:", error);
      return error;
    },
  });

  await server.start();

  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req, res }) => {
        try {
          console.log("Received cookies:", req.cookies);

          // Try to get token from Authorization header first
          let token: string | undefined;
          const authHeader = req.headers.authorization;

          if (authHeader?.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
            console.log("Using token from Authorization header");
          }
          // Then try to get token from cookies
          else if (req.cookies?.auth_token) {
            token = req.cookies.auth_token;
            console.log("Using token from cookies");
          }

          if (!token) {
            console.log("No authentication token found in headers or cookies");
            return createContext(prisma, req, res, null);
          }

          console.log("Extracted token:", token);
          try {
            const tokenPayload = await tokenService.verifyToken(
              token as string
            );
            if (!tokenPayload) {
              console.log("Invalid or expired token");
              return createContext(prisma, req, res, null);
            }

            console.log("Token payload:", tokenPayload);

            // Fetch the full user from the database
            const user = await prisma.user.findUnique({
              where: { id: tokenPayload.userId },
            });

            if (!user) {
              console.log("User not found for ID:", tokenPayload.userId);
              return createContext(prisma, req, res, null);
            }

            console.log("Fetched user:", user);

            return createContext(prisma, req, res, user);
          } catch (error) {
            console.error("Error verifying token:", error);
            throw error;
          }
        } catch {
          return createContext(prisma, req, res, null);
        }
      },
    })
  );

  // Mount auth REST routes
  app.use("/api/auth", authRoutes);

  // Health check
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // Centralized error handling middleware (should be last)
  //   app.use(errorHandler);

  return { app, httpServer };
}
