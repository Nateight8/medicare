// tests/auth/services/magicLinkService.test.ts

// Mock dependencies before imports
// Mock dependencies before imports
const mockRedisUtil = {
  get: jest.fn<(key: string) => Promise<string | null>>(),
  set: jest.fn<
    (key: string, value: string, ttlInSeconds?: number) => Promise<boolean>
  >(),
  del: jest.fn<(key: string) => Promise<boolean>>(),
  ttl: jest.fn<(key: string) => Promise<number>>(),
};

// A Jest mock: takes 1 arg (mail options), returns a Promise<SentMessageInfo>
// const sendMailMock = jest.fn<(mail: any) => Promise<SentMessageInfo>>();

const mockEmailService = {
  sendMagicLink: jest.fn<(email: string, link: string) => Promise<void>>(),
  sendOTP: jest.fn<(email: string, otp: string) => Promise<void>>(),
};

const mockTokenService = {
  generateToken:
    jest.fn<
      (payload: any, options?: { expiresIn: string }) => Promise<string>
    >(),
  verifyToken: jest.fn<(token: string) => any>(),
};

jest.mock("../../../../src/lib/redis", () => ({
  redisUtil: mockRedisUtil,
}));

jest.mock("../../../../src/auth/services/emailService", () => ({
  emailService: mockEmailService,
}));

jest.mock("../../../../src/auth/services/tokenService", () => ({
  JWTTokenService: jest.fn().mockImplementation(() => mockTokenService),
}));

jest.mock("crypto", () => ({
  randomUUID: jest.fn(() => "test-uuid-123"),
}));

import { MagicLinkServiceImpl } from "../../../../src/auth/services/magicLinkService";
import { describe, beforeEach, it, expect, jest } from "@jest/globals";
import type { AuthConfig, TokenPayload } from "../../../../src/auth/types";

describe("MagicLinkServiceImpl", () => {
  let service: MagicLinkServiceImpl;
  const mockConfig: AuthConfig = {
    magicLinkBaseUrl: "https://example.com/auth/verify",
    jwtSecret: "test-secret",
    tokenExpiry: "15m",
    redisPrefix: "test:",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset default mock implementations
    mockRedisUtil.set.mockResolvedValue(true);
    mockRedisUtil.get.mockResolvedValue(null);
    // mockRedisUtil.del.mockResolvedValue(1);
    mockRedisUtil.ttl.mockResolvedValue(900); // 15 minutes
    mockEmailService.sendMagicLink.mockResolvedValue(undefined);
    mockTokenService.generateToken.mockResolvedValue("mock-token-123");

    service = new MagicLinkServiceImpl(mockConfig);
  });

  describe("constructor", () => {
    it("should initialize with provided config", () => {
      const customConfig: AuthConfig = {
        magicLinkBaseUrl: "https://custom.com/auth",
        jwtSecret: "custom-secret",
        tokenExpiry: 300000, // number format
        redisPrefix: "custom:",
      };

      const customService = new MagicLinkServiceImpl(customConfig);

      // Should convert number tokenExpiry to string
      expect(customService["config"].tokenExpiry).toBe("300000ms");
    });

    it("should use default values for missing config", () => {
      // Provide minimal required config with empty/undefined values to test defaults
      const minimalConfig: AuthConfig = {
        magicLinkBaseUrl: "",
        jwtSecret: "",
        tokenExpiry: 0,
      };
      const minimalService = new MagicLinkServiceImpl(minimalConfig);

      expect(minimalService["config"].magicLinkBaseUrl).toBe("");
      expect(minimalService["config"].jwtSecret).toBe("your-secret-key");
      expect(minimalService["config"].tokenExpiry).toBe("0ms");
      expect(minimalService["config"].redisPrefix).toBe("auth:");
    });
  });

  describe("requestMagicLink", () => {
    const testEmail = "test@example.com";

    it("should successfully generate and send magic link", async () => {
      const result = await service.requestMagicLink(testEmail);

      // Should generate token with correct payload
      expect(mockTokenService.generateToken).toHaveBeenCalledWith(
        { email: testEmail, type: "magiclink" },
        { expiresIn: "15m" }
      );

      // Should store token in Redis
      expect(mockRedisUtil.set).toHaveBeenCalledWith(
        "test:magiclink:mock-token-123",
        expect.stringContaining(testEmail),
        900
      );

      // Should store email mapping
      expect(mockRedisUtil.set).toHaveBeenCalledWith(
        "test:email:test@example.com",
        expect.stringContaining("mock-token-123"),
        900
      );

      // Should send email
      expect(mockEmailService.sendMagicLink).toHaveBeenCalledWith(
        testEmail,
        "https://example.com/auth/verify?token=mock-token-123"
      );

      expect(result).toEqual({ expiresIn: "15m" });
    });

    it("should handle existing tokens for email mapping", async () => {
      // Mock existing tokens
      mockRedisUtil.get.mockResolvedValueOnce('["existing-token"]');

      await service.requestMagicLink(testEmail);

      // Should add new token to existing list
      expect(mockRedisUtil.set).toHaveBeenCalledWith(
        "test:email:test@example.com",
        '["existing-token","mock-token-123"]',
        900
      );
    });

    it("should throw error if Redis storage fails", async () => {
      mockRedisUtil.set.mockResolvedValueOnce(false);

      await expect(service.requestMagicLink(testEmail)).rejects.toThrow(
        "Failed to store token in Redis"
      );
    });

    it("should propagate email service errors", async () => {
      mockEmailService.sendMagicLink.mockRejectedValueOnce(
        new Error("SMTP Error")
      );

      await expect(service.requestMagicLink(testEmail)).rejects.toThrow(
        "SMTP Error"
      );
    });
  });

  describe("validateToken", () => {
    const testToken = "test-token";
    const testEmail = "test@example.com";
    const mockTokenData = {
      email: testEmail,
      status: "active",
      issuedAt: Date.now() - 60000, // 1 minute ago
      expiresAt: Date.now() + 840000, // 14 minutes from now
      lastUsedAt: null,
    };

    it("should successfully validate active token", async () => {
      // Mock Redis data
      mockRedisUtil.get.mockResolvedValueOnce(JSON.stringify(mockTokenData));

      // Mock token verification
      const mockPayload: TokenPayload = { email: testEmail, type: "magiclink" };
      mockTokenService.verifyToken.mockResolvedValueOnce(mockPayload);

      const result = await service.validateToken(testToken);

      expect(result.payload).toEqual(mockPayload);
      expect(result.error).toBeUndefined();

      // Should update token status to used
      expect(mockRedisUtil.set).toHaveBeenCalledWith(
        "test:magiclink:test-token",
        expect.stringContaining('"status":"used"'),
        60
      );
    });

    it("should return error for token not found in Redis", async () => {
      mockRedisUtil.get.mockResolvedValueOnce(null);

      const result = await service.validateToken(testToken);

      expect(result.payload).toBeNull();
      expect(result.error).toBe("used_or_revoked");
    });

    it("should return error for expired JWT token", async () => {
      // Mock Redis to return valid token data
      mockRedisUtil.get.mockResolvedValueOnce(JSON.stringify(mockTokenData));

      // Mock the token verification to throw an 'expired' error
      const error = new Error("expired");
      error.message = "expired";
      mockTokenService.verifyToken.mockRejectedValueOnce(error);

      const result = await service.validateToken(testToken);

      expect(result.payload).toBeNull();
      expect(result.error).toBe("expired");
    });

    it("should return error for token expired in Redis", async () => {
      const expiredTokenData = {
        ...mockTokenData,
        expiresAt: Date.now() - 60000, // Expired 1 minute ago
      };

      // Mock Redis to return the expired token data
      mockRedisUtil.get.mockResolvedValueOnce(JSON.stringify(expiredTokenData));
      // Mock the del method since we expect it to be called for cleanup
      mockRedisUtil.del.mockResolvedValueOnce(true);
      // Mock token verification to pass
      mockTokenService.verifyToken.mockResolvedValueOnce({
        email: testEmail,
        type: "magiclink",
      });

      const result = await service.validateToken(testToken);

      expect(result.payload).toBeNull();
      expect(result.error).toBe("expired");
      // Should clean up expired token
      expect(mockRedisUtil.del).toHaveBeenCalledWith(
        "test:magiclink:test-token"
      );
    });

    it("should handle JWT verification errors", async () => {
      mockRedisUtil.get.mockResolvedValueOnce(JSON.stringify(mockTokenData));
      mockTokenService.verifyToken.mockRejectedValueOnce(new Error("expired"));

      const result = await service.validateToken(testToken);

      expect(result.payload).toBeNull();
      expect(result.error).toBe("expired");
    });

    it("should return error for invalid token type", async () => {
      mockRedisUtil.get.mockResolvedValueOnce(JSON.stringify(mockTokenData));
      mockTokenService.verifyToken.mockResolvedValueOnce({
        email: testEmail,
        type: "different-type",
      });

      const result = await service.validateToken(testToken);

      expect(result.payload).toBeNull();
      expect(result.error).toBe("invalid");
    });
  });

  describe("revokeMagicLink", () => {
    const testEmail = "test@example.com";
    const testTokens = ["token1", "token2", "token3"];

    it("should revoke all tokens for email", async () => {
      mockRedisUtil.get.mockResolvedValueOnce(JSON.stringify(testTokens));

      const result = await service.revokeMagicLink(testEmail);

      // Should delete all individual token keys
      expect(mockRedisUtil.del).toHaveBeenCalledWith("test:magiclink:token1");
      expect(mockRedisUtil.del).toHaveBeenCalledWith("test:magiclink:token2");
      expect(mockRedisUtil.del).toHaveBeenCalledWith("test:magiclink:token3");

      // Should delete email mapping
      expect(mockRedisUtil.del).toHaveBeenCalledWith(
        "test:email:test@example.com"
      );

      expect(result).toBe(true);
    });

    it("should return false when no tokens found", async () => {
      mockRedisUtil.get.mockResolvedValueOnce(null);

      const result = await service.revokeMagicLink(testEmail);

      expect(result).toBe(false);
      expect(mockRedisUtil.del).not.toHaveBeenCalled();
    });

    it("should propagate Redis errors", async () => {
      mockRedisUtil.get.mockResolvedValueOnce(JSON.stringify(testTokens));
      mockRedisUtil.del.mockRejectedValueOnce(
        new Error("Redis connection error")
      );

      await expect(service.revokeMagicLink(testEmail)).rejects.toThrow(
        "Redis connection error"
      );
    });
  });

  describe("QR Authentication methods", () => {
    describe("storeAuthRequest", () => {
      it("should store auth request and return requestId", async () => {
        const userId = "user-123";
        const result = await service.storeAuthRequest(userId, 120);

        expect(mockRedisUtil.set).toHaveBeenCalledWith(
          "test:qr:test-uuid-123",
          userId,
          120
        );
        expect(result).toBe("test-uuid-123");
      });

      it("should throw error if storage fails", async () => {
        mockRedisUtil.set.mockResolvedValueOnce(false);

        await expect(service.storeAuthRequest("user-123")).rejects.toThrow(
          "Failed to store auth request test-uuid-123"
        );
      });
    });

    describe("getAuthRequestStatus", () => {
      it("should return parsed status", async () => {
        const mockStatus = { status: "authenticated", token: "auth-token" };
        mockRedisUtil.get.mockResolvedValueOnce(JSON.stringify(mockStatus));

        const result = await service.getAuthRequestStatus("test-request-id");

        expect(mockRedisUtil.get).toHaveBeenCalledWith(
          "test:qrstatus:test-request-id"
        );
        expect(result).toEqual(mockStatus);
      });

      it("should return null if no status found", async () => {
        mockRedisUtil.get.mockResolvedValueOnce(null);

        const result = await service.getAuthRequestStatus("test-request-id");

        expect(result).toBeNull();
      });
    });

    describe("consumeAuthRequest", () => {
      it("should return userId and delete request", async () => {
        const userId = "user-123";
        mockRedisUtil.get.mockResolvedValueOnce(userId);

        const result = await service.consumeAuthRequest("test-request-id");

        expect(mockRedisUtil.get).toHaveBeenCalledWith(
          "test:qr:test-request-id"
        );
        expect(mockRedisUtil.del).toHaveBeenCalledWith(
          "test:qr:test-request-id"
        );
        expect(result).toBe(userId);
      });

      it("should return null if request not found", async () => {
        mockRedisUtil.get.mockResolvedValueOnce(null);

        const result = await service.consumeAuthRequest("test-request-id");

        expect(result).toBeNull();
        expect(mockRedisUtil.del).not.toHaveBeenCalled();
      });
    });

    describe("markAuthRequestComplete", () => {
      it("should store completion status", async () => {
        await service.markAuthRequestComplete(
          "test-request-id",
          "auth-token",
          60
        );

        expect(mockRedisUtil.set).toHaveBeenCalledWith(
          "test:qrstatus:test-request-id",
          '{"status":"authenticated","token":"auth-token"}',
          60
        );
      });
    });
  });

  describe("private helper methods", () => {
    describe("removeTokenFromEmailMapping", () => {
      const testEmail = "test@example.com";
      const testToken = "token-to-remove";

      it("should remove token and update mapping", async () => {
        const tokens = ["token1", testToken, "token3"];
        mockRedisUtil.get.mockResolvedValueOnce(JSON.stringify(tokens));
        mockRedisUtil.ttl.mockResolvedValueOnce(600); // 10 minutes remaining

        await service["removeTokenFromEmailMapping"](testEmail, testToken);

        expect(mockRedisUtil.set).toHaveBeenCalledWith(
          "test:email:test@example.com",
          '["token1","token3"]',
          600
        );
      });

      it("should delete mapping when no tokens remain", async () => {
        const tokens = [testToken];
        mockRedisUtil.get.mockResolvedValueOnce(JSON.stringify(tokens));

        await service["removeTokenFromEmailMapping"](testEmail, testToken);

        expect(mockRedisUtil.del).toHaveBeenCalledWith(
          "test:email:test@example.com"
        );
      });

      it("should handle missing mapping gracefully", async () => {
        mockRedisUtil.get.mockResolvedValueOnce(null);

        await service["removeTokenFromEmailMapping"](testEmail, testToken);

        // Should not throw and not call set/del
        expect(mockRedisUtil.set).not.toHaveBeenCalled();
        expect(mockRedisUtil.del).not.toHaveBeenCalled();
      });
    });
  });
});
