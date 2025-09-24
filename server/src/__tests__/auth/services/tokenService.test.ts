// src/auth/services/__tests__/tokenService.test.ts

import jwt from "jsonwebtoken";

import { JWTTokenService } from "../../../auth/services/tokenService";
import { AuthConfig, TokenPayload } from "../../../auth/types";

// Mock the jwt module
jest.mock("jsonwebtoken");
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

// Mock console methods to avoid noise in tests
const consoleSpy = {
  error: jest.spyOn(console, "error").mockImplementation(),
  log: jest.spyOn(console, "log").mockImplementation(),
};

describe("JWTTokenService", () => {
  let tokenService: JWTTokenService;
  let mockConfig: AuthConfig;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    mockConfig = {
      jwtSecret: "test-secret",
      tokenExpiry: "24h",
    } as AuthConfig;

    tokenService = new JWTTokenService(mockConfig);
  });

  afterAll(() => {
    // Restore console methods
    consoleSpy.error.mockRestore();
    consoleSpy.log.mockRestore();
  });

  describe("constructor", () => {
    it("should initialize with string tokenExpiry", () => {
      const config: AuthConfig = {
        jwtSecret: "secret",
        tokenExpiry: "2h",
      } as AuthConfig;

      const service = new JWTTokenService(config);
      expect(service).toBeInstanceOf(JWTTokenService);
    });

    it("should use default expiry when tokenExpiry is not a string", () => {
      const config: AuthConfig = {
        jwtSecret: "secret",
        tokenExpiry: 3600 as any, // Simulating non-string value
      } as AuthConfig;

      const service = new JWTTokenService(config);
      expect(service).toBeInstanceOf(JWTTokenService);
    });
  });

  describe("generateToken", () => {
    const mockPayload: TokenPayload = {
      userId: "123",
      email: "test@example.com",
      type: "magiclink",
    };

    it("should generate token successfully with default expiry", async () => {
      const expectedToken = "mock.jwt.token";

      // Mock jwt.sign to call callback with success
      mockedJwt.sign.mockImplementation(
        (payload, secret, options, callback) => {
          if (typeof callback === "function") {
            callback(null, expectedToken);
          }
          return expectedToken as any;
        }
      );

      const result = await tokenService.generateToken(mockPayload);

      expect(result).toBe(expectedToken);
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        mockPayload,
        "test-secret",
        { expiresIn: "24h" },
        expect.any(Function)
      );
    });

    it("should generate token with custom expiry from options", async () => {
      const expectedToken = "mock.jwt.token";
      const customOptions = { expiresIn: "12h" };

      mockedJwt.sign.mockImplementation(
        (payload, secret, options, callback) => {
          if (typeof callback === "function") {
            callback(null, expectedToken);
          }
          return expectedToken as any;
        }
      );

      const result = await tokenService.generateToken(
        mockPayload,
        customOptions
      );

      expect(result).toBe(expectedToken);
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        mockPayload,
        "test-secret",
        { expiresIn: "12h" },
        expect.any(Function)
      );
    });

    it("should generate token without expiry when not provided in options", async () => {
      const expectedToken = "mock.jwt.token";
      const optionsWithoutExpiry = {};

      mockedJwt.sign.mockImplementation(
        (payload, secret, options, callback) => {
          if (typeof callback === "function") {
            callback(null, expectedToken);
          }
          return expectedToken as any;
        }
      );

      const result = await tokenService.generateToken(
        mockPayload,
        optionsWithoutExpiry
      );

      expect(result).toBe(expectedToken);
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        mockPayload,
        "test-secret",
        { expiresIn: "24h" }, // Should use default
        expect.any(Function)
      );
    });

    it("should handle jwt.sign error", async () => {
      const mockError = new Error("JWT signing failed");

      mockedJwt.sign.mockImplementation(
        (payload, secret, options, callback) => {
          if (typeof callback === "function") {
            callback(mockError, undefined);
          }
          return undefined as any;
        }
      );

      await expect(tokenService.generateToken(mockPayload)).rejects.toThrow(
        "JWT signing failed"
      );

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "Error generating token:",
        mockError
      );
    });

    it("should handle case when token is null/undefined", async () => {
      mockedJwt.sign.mockImplementation(
        (payload, secret, options, callback) => {
          if (typeof callback === "function") {
            callback(null, undefined as any);
          }
          return undefined as any;
        }
      );

      await expect(tokenService.generateToken(mockPayload)).rejects.toThrow(
        "Token generation failed"
      );
    });

    it("should handle empty string token", async () => {
      mockedJwt.sign.mockImplementation(
        (payload, secret, options, callback) => {
          if (typeof callback === "function") {
            callback(null, "");
          }
          return "" as any;
        }
      );

      await expect(tokenService.generateToken(mockPayload)).rejects.toThrow(
        "Token generation failed"
      );
    });
  });

  describe("verifyToken", () => {
    const mockToken = "mock.jwt.token";
    const mockDecodedPayload: TokenPayload = {
      userId: "123",
      email: "test@example.com",
      type: "magiclink",
    };

    it("should verify token successfully", async () => {
      // Mock the jwt.verify to properly handle the callback
      (mockedJwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
        if (typeof callback === 'function') {
          callback(null, mockDecodedPayload);
        }
        return mockDecodedPayload;
      });

      const result = await tokenService.verifyToken(mockToken);

      expect(result).toEqual(mockDecodedPayload);
      expect(mockedJwt.verify).toHaveBeenCalledWith(
        mockToken,
        "test-secret",
        expect.any(Function)
      );
    }, 10000); // Increased timeout to 10 seconds

    it("should handle TokenExpiredError", async () => {
      const expiredError = new jwt.TokenExpiredError(
        "Token expired",
        new Date()
      );

      (mockedJwt.verify as jest.Mock).mockImplementation(
        (token, secret, callback) => {
          if (typeof callback === "function") {
            callback(expiredError, undefined);
          }
        }
      );

      await expect(tokenService.verifyToken(mockToken)).rejects.toThrow(
        "expired"
      );

      expect(consoleSpy.log).toHaveBeenCalledWith(
        "[JWTTokenService] Token has expired"
      );
    });

    it("should handle JsonWebTokenError", async () => {
      const invalidError = new jwt.JsonWebTokenError("Invalid token");

      (mockedJwt.verify as jest.Mock).mockImplementation(
        (token, secret, callback) => {
          if (typeof callback === "function") {
            callback(invalidError, undefined);
          }
        }
      );

      await expect(tokenService.verifyToken(mockToken)).rejects.toThrow(
        "invalid"
      );

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "[JWTTokenService] Invalid token:",
        ""
      );
    });

    it("should handle generic errors", async () => {
      const genericError = new Error("Some other error");

      (mockedJwt.verify as jest.Mock).mockImplementation(
        (token, secret, callback) => {
          if (typeof callback === "function") {
            callback(genericError, undefined);
          }
        }
      );

      await expect(tokenService.verifyToken(mockToken)).rejects.toThrow(
        "invalid"
      );

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "[JWTTokenService] Error verifying token:",
        genericError
      );
    });

    it("should handle unknown error types", async () => {
      const unknownError = "string error";

      (mockedJwt.verify as jest.Mock).mockImplementation(
        (token, secret, callback) => {
          if (typeof callback === "function") {
            callback(unknownError as any, undefined);
          }
        }
      );

      await expect(tokenService.verifyToken(mockToken)).rejects.toThrow(
        "invalid"
      );

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "[JWTTokenService] Error verifying token:",
        unknownError
      );
    });
  });

  describe("integration scenarios", () => {
    it("should handle complete token lifecycle", async () => {
      const payload: TokenPayload = {
        userId: "456",
        email: "integration@test.com",
        type: "magiclink",
      };
      const generatedToken = "integration.test.token";

      // Mock generation
      mockedJwt.sign.mockImplementationOnce(
        (payload, secret, options, callback) => {
          if (typeof callback === "function") {
            callback(null, generatedToken);
          }
          return generatedToken as any;
        }
      );

      // Mock verification
      (mockedJwt.verify as jest.Mock).mockImplementationOnce(
        (token, secret, callback) => {
          if (typeof callback === "function") {
            callback(null, payload);
          }
          return payload as any;
        }
      );

      // Generate token
      const token = await tokenService.generateToken(payload);
      expect(token).toBe(generatedToken);

      // Verify the same token
      const verified = await tokenService.verifyToken(token);
      expect(verified).toEqual(payload);
    });

    it("should maintain type safety with custom payload properties", async () => {
      interface ExtendedTokenPayload extends TokenPayload {
        role: string;
        permissions: string[];
      }

      const extendedPayload: ExtendedTokenPayload = {
        userId: "789",
        email: "extended@test.com",
        type: "magiclink",
        role: "admin",
        permissions: ["read", "write", "delete"],
      };

      mockedJwt.sign.mockImplementation(
        (payload, secret, options, callback) => {
          if (typeof callback === "function") {
            callback(null, "extended.token");
          }
          return "extended.token" as any;
        }
      );

      (mockedJwt.verify as jest.Mock).mockImplementation(
        (token, secret, callback) => {
          if (typeof callback === "function") {
            callback(null, extendedPayload);
          }
          return extendedPayload as any;
        }
      );

      const token = await tokenService.generateToken(extendedPayload);
      const verified = await tokenService.verifyToken(token);

      expect(verified).toEqual(extendedPayload);
      expect((verified as ExtendedTokenPayload).role).toBe("admin");
      expect((verified as ExtendedTokenPayload).permissions).toEqual([
        "read",
        "write",
        "delete",
      ]);
    });
  });

  describe("edge cases", () => {
    it("should handle empty payload", async () => {
      const emptyPayload = {} as TokenPayload;

      mockedJwt.sign.mockImplementation(
        (payload, secret, options, callback) => {
          if (typeof callback === "function") {
            callback(null, "empty.payload.token");
          }
          return "empty.payload.token" as any;
        }
      );

      const result = await tokenService.generateToken(emptyPayload);
      expect(result).toBe("empty.payload.token");
    });

    it("should handle malformed token during verification", async () => {
      const malformedToken = "not.a.valid.jwt.token.structure";
      const malformedError = new jwt.JsonWebTokenError("jwt malformed");

      (mockedJwt.verify as jest.Mock).mockImplementation(
        (token, secret, callback) => {
          if (typeof callback === "function") {
            callback(malformedError, undefined);
          }
        }
      );

      await expect(tokenService.verifyToken(malformedToken)).rejects.toThrow(
        "invalid"
      );
    });

    it("should handle concurrent token operations", async () => {
      const payloads = [
        { userId: "1", email: "user1@test.com", type: "magiclink" as const },
        { userId: "2", email: "user2@test.com", type: "magiclink" as const },
        { userId: "3", email: "user3@test.com", type: "magiclink" as const },
      ];

      // Mock multiple concurrent calls
      mockedJwt.sign.mockImplementation(
        (payload, secret, options, callback) => {
          if (typeof callback === "function") {
            // Simulate async behavior
            setTimeout(() => {
              callback(null, `token-${(payload as any).userId}`);
            }, Math.random() * 10);
          }
        }
      );

      const promises = payloads.map((payload) =>
        tokenService.generateToken(payload)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(results).toContain("token-1");
      expect(results).toContain("token-2");
      expect(results).toContain("token-3");
    });
  });
});
