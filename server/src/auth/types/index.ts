import { Request } from "express";
import type { User as PrismaUser } from "@prisma/client";

export interface EmailPayload {
  email: string;
}

export interface OTPPayload {
  email: string;
  otp: string;
}

export interface MagicLinkPayload {
  email: string;
  token: string;
}

export interface TokenPayload {
  userId?: string;  // Made optional since we're using email as the primary identifier
  email: string;
  type: "magiclink" | "otp";
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

export interface TokenOptions {
  expiresIn?: string | number;
  [key: string]: unknown;
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export interface User extends PrismaUser {}

export interface MagicLinkService {
  requestMagicLink(email: string): Promise<{ expiresIn: string }>;
  validateToken(token: string): Promise<TokenPayload | null>;
}

export interface OTPService {
  generateOTP(email: string): Promise<void>;
  validateOTP(email: string, otp: string): Promise<TokenPayload | null>;
}

export interface EmailService {
  sendMagicLink(email: string, link: string): Promise<void>;
  sendOTP(email: string, otp: string): Promise<void>;
}

export interface TokenService {
  generateToken(payload: TokenPayload, options?: TokenOptions): Promise<string>;
  verifyToken(token: string): Promise<TokenPayload | null>;
}

export interface AuthConfig {
  magicLinkBaseUrl: string;
  jwtSecret: string;
  tokenExpiry: string | number;
  redisPrefix?: string;
}

export type AuthMethod = "magiclink" | "otp";
