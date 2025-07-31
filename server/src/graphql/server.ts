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
          const authHeader = req.headers.authorization;
          if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return {
              ...createContext(prisma),
              user: null,
              req,
              res,
            };
          }

          const token = authHeader.split(" ")[1];
          const user = await tokenService.verifyToken(token as string);

          return {
            ...createContext(prisma),
            user,
            req,
            res,
          };
        } catch {
          return {
            ...createContext(prisma),
            user: null,
            req,
            res,
          };
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
