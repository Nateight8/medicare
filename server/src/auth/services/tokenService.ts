// src/auth/services/tokenService.ts

import jwt from 'jsonwebtoken';
import { TokenPayload, TokenOptions, TokenService, AuthConfig } from "../types";

// Helper function to promisify jwt methods
const jwtSign = (payload: string | object | Buffer, secret: string, options?: jwt.SignOptions): Promise<string> => {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, secret, options || {}, (err, token) => {
      if (err) return reject(err);
      if (!token) return reject(new Error('Token generation failed'));
      resolve(token);
    });
  });
};

const jwtVerify = (token: string, secret: string): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
};

export class JWTTokenService implements TokenService {
  private readonly secret: string;
  private readonly defaultExpiry: string;

  constructor(config: AuthConfig) {
    this.secret = config.jwtSecret;
    this.defaultExpiry = typeof config.tokenExpiry === 'string' ? 
      config.tokenExpiry : '1h';
  }

  async generateToken(
    payload: TokenPayload,
    options?: TokenOptions
  ): Promise<string> {
    const expiresIn = options?.expiresIn || this.defaultExpiry;
    
    try {
      // Create the token with expiresIn directly in the options
      // This bypasses the TypeScript type issues while maintaining runtime safety
      const signOptions: any = {};
      
      if (expiresIn) {
        signOptions.expiresIn = expiresIn;
      }
      
      return await jwtSign(
        payload as object, 
        this.secret, 
        signOptions as jwt.SignOptions
      );
    } catch (error) {
      console.error('Error generating token:', error);
      throw error;
    }
  }

  async verifyToken(token: string): Promise<TokenPayload | null> {
    try {
      const decoded = await jwtVerify(token, this.secret);
      return decoded as TokenPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        console.log("[JWTTokenService] Token has expired");
        throw new Error('expired');
      } else if (err instanceof jwt.JsonWebTokenError) {
        console.error("[JWTTokenService] Invalid token:", err.message);
        throw new Error('invalid');
      }
      console.error("[JWTTokenService] Error verifying token:", err);
      throw new Error('invalid');
    }
  }
}
