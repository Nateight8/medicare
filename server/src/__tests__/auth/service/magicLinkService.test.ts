// src/__tests__/auth/service/magicLinkService.test.ts
import { jest } from "@jest/globals";

// ==========================
// 1️⃣ Mock dependencies BEFORE importing the service
// ==========================

// Mock Redis utility with all methods typed
const mockRedisUtil = {
  set: jest.fn(() => Promise.resolve(true)),
  get: jest.fn(() => Promise.resolve<string | null>(null)),
  del: jest.fn(() => Promise.resolve(true)),
  ttl: jest.fn(() => Promise.resolve(900)),
  exists: jest.fn(() => Promise.resolve(true)),
};
jest.unstable_mockModule("../../../lib/redis", () => ({
  redisUtil: mockRedisUtil,
}));

// Mock emailService
const mockSendMagicLink = jest.fn(() => Promise.resolve(undefined));
jest.unstable_mockModule("../../../auth/services/emailService", () => ({
  emailService: { sendMagicLink: mockSendMagicLink },
}));

// Mock tokenService
const mockGenerateToken = jest.fn(() => Promise.resolve("mocked-token"));
const mockVerifyToken = jest.fn(() =>
  Promise.resolve({
    email: "user@example.com",
    type: "magiclink",
  })
);

jest.unstable_mockModule("../../../auth/services/tokenService", () => ({
  JWTTokenService: jest.fn().mockImplementation(() => ({
    generateToken: mockGenerateToken,
    verifyToken: mockVerifyToken,
  })),
}));

// ==========================
// 2️⃣ Import modules AFTER mocks
// ==========================
const { MagicLinkServiceImpl } = await import(
  "../../../auth/services/magicLinkService"
);
const { redisUtil } = await import("../../../lib/redis");
const { emailService } = await import("../../../auth/services/emailService");

// ==========================
// 3️⃣ Test suite
// ==========================
describe("MagicLinkServiceImpl - requestMagicLink", () => {
  let service: InstanceType<typeof MagicLinkServiceImpl>;

  const mockConfig = {
    magicLinkBaseUrl: "https://app.test",
    jwtSecret: "test-secret",
    tokenExpiry: "1h",
    redisPrefix: "auth:",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MagicLinkServiceImpl(mockConfig);

    // Reset default behavior
    mockRedisUtil.get.mockResolvedValue(null);
    mockRedisUtil.set.mockResolvedValue(true);
    mockRedisUtil.del.mockResolvedValue(true);
    mockRedisUtil.ttl.mockResolvedValue(900);
    mockRedisUtil.exists.mockResolvedValue(true);

    mockGenerateToken.mockResolvedValue("mocked-token");
    mockSendMagicLink.mockResolvedValue(undefined);
  });

  it("should generate a token, store it in Redis, and send an email", async () => {
    const email = "user@example.com";

    const result = await service.requestMagicLink(email);

    expect(result).toEqual({ expiresIn: "1h" });

    // Token generation
    expect(mockGenerateToken).toHaveBeenCalledWith(
      { email, type: "magiclink" },
      { expiresIn: "1h" }
    );

    // Redis set
    const redisKey = "auth:magiclink:mocked-token";
    expect(mockRedisUtil.set).toHaveBeenCalledWith(
      redisKey,
      expect.stringContaining(email),
      900
    );

    // Email sent
    expect(mockSendMagicLink).toHaveBeenCalledWith(
      email,
      expect.stringContaining("mocked-token")
    );
  });

  it("should throw if Redis fails to store token", async () => {
    mockRedisUtil.set.mockResolvedValueOnce(false);

    await expect(service.requestMagicLink("user@example.com")).rejects.toThrow(
      "Failed to store token in Redis"
    );
  });
});

describe("MagicLinkServiceImpl - validateToken", () => {
  let service: InstanceType<typeof MagicLinkServiceImpl>;

  const mockConfig = {
    magicLinkBaseUrl: "https://app.test",
    jwtSecret: "test-secret",
    tokenExpiry: "1h",
    redisPrefix: "auth:",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MagicLinkServiceImpl(mockConfig);

    // Reset default behavior
    mockRedisUtil.get.mockResolvedValue(null);
    mockRedisUtil.set.mockResolvedValue(true);
    mockRedisUtil.del.mockResolvedValue(true);
    mockRedisUtil.ttl.mockResolvedValue(900);
    mockRedisUtil.exists.mockResolvedValue(true);

    mockGenerateToken.mockResolvedValue("mocked-token");
    mockSendMagicLink.mockResolvedValue(undefined);

    // Reset verifyToken mock
    mockVerifyToken.mockResolvedValue({
      email: "user@example.com",
      type: "magiclink",
    });
  });

  it("should return used_or_revoked when token not found in Redis", async () => {
    mockRedisUtil.get.mockResolvedValueOnce(null);

    const result = await service.validateToken("some-token");

    expect(result).toEqual({
      payload: null,
      error: "used_or_revoked",
    });

    expect(mockRedisUtil.get).toHaveBeenCalledWith("auth:magiclink:some-token");
  });

  it("should return invalid when token has wrong type", async () => {
    const tokenData = JSON.stringify({
      email: "user@example.com",
      status: "active",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 900000,
      lastUsedAt: null,
    });
    mockRedisUtil.get.mockResolvedValueOnce(tokenData);

    // Mock token verification to return wrong type
    mockVerifyToken.mockResolvedValueOnce({
      email: "user@example.com",
      type: "refresh", // Wrong type
    });

    const result = await service.validateToken("some-token");

    expect(result).toEqual({
      payload: null,
      error: "invalid",
    });
  });

  it("should return expired when token is expired", async () => {
    const expiredTime = Date.now() - 1000; // 1 second ago
    const tokenData = JSON.stringify({
      email: "user@example.com",
      status: "active",
      issuedAt: expiredTime - 900000,
      expiresAt: expiredTime,
      lastUsedAt: null,
    });
    mockRedisUtil.get.mockResolvedValueOnce(tokenData);

    mockVerifyToken.mockResolvedValueOnce({
      email: "user@example.com",
      type: "magiclink",
    });

    const result = await service.validateToken("some-token");

    expect(result).toEqual({
      payload: null,
      error: "expired",
    });

    // Should clean up expired token
    expect(mockRedisUtil.del).toHaveBeenCalledWith("auth:magiclink:some-token");
  });

  it("should return invalid when token verification throws expired error", async () => {
    const tokenData = JSON.stringify({
      email: "user@example.com",
      status: "active",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 900000,
      lastUsedAt: null,
    });
    mockRedisUtil.get.mockResolvedValueOnce(tokenData);

    mockVerifyToken.mockRejectedValueOnce(new Error("expired"));

    const result = await service.validateToken("some-token");

    expect(result).toEqual({
      payload: null,
      error: "expired",
    });
  });

  it("should return invalid when token verification throws invalid error", async () => {
    const tokenData = JSON.stringify({
      email: "user@example.com",
      status: "active",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 900000,
      lastUsedAt: null,
    });
    mockRedisUtil.get.mockResolvedValueOnce(tokenData);

    mockVerifyToken.mockRejectedValueOnce(new Error("invalid"));

    const result = await service.validateToken("some-token");

    expect(result).toEqual({
      payload: null,
      error: "invalid",
    });
  });

  it("should successfully validate token and mark as used", async () => {
    const tokenData = JSON.stringify({
      email: "user@example.com",
      status: "active",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 900000,
      lastUsedAt: null,
    });
    mockRedisUtil.get.mockResolvedValueOnce(tokenData);

    const mockPayload = {
      email: "user@example.com",
      type: "magiclink",
    };

    mockVerifyToken.mockResolvedValueOnce(mockPayload);

    // Mock email mapping methods
    mockRedisUtil.get.mockResolvedValueOnce('["some-token"]'); // email tokens
    mockRedisUtil.ttl.mockResolvedValueOnce(600); // remaining TTL

    const result = await service.validateToken("some-token");

    expect(result).toEqual({
      payload: mockPayload,
      error: undefined,
    });

    // Should mark token as used
    expect(mockRedisUtil.set).toHaveBeenCalledWith(
      "auth:magiclink:some-token",
      expect.stringContaining('"status":"used"'),
      60
    );

    // Should delete the email mapping since no tokens left
    expect(mockRedisUtil.del).toHaveBeenCalledWith(
      "auth:email:user@example.com"
    );
  });

  it("should handle malformed token data in Redis", async () => {
    mockRedisUtil.get.mockResolvedValueOnce("invalid-json");

    mockVerifyToken.mockResolvedValueOnce({
      email: "user@example.com",
      type: "magiclink",
    });

    const result = await service.validateToken("some-token");

    expect(result).toEqual({
      payload: null,
      error: "invalid",
    });
  });

  it("should handle Redis errors during validation", async () => {
    // Mock the first Redis call to fail
    mockRedisUtil.get.mockRejectedValueOnce(
      new Error("Redis connection failed")
    );

    // The service will throw the error since it's not wrapped in try-catch
    await expect(service.validateToken("some-token")).rejects.toThrow(
      "Redis connection failed"
    );
  });
});

describe("MagicLinkServiceImpl - revokeMagicLink", () => {
  let service: InstanceType<typeof MagicLinkServiceImpl>;

  const mockConfig = {
    magicLinkBaseUrl: "https://app.test",
    jwtSecret: "test-secret",
    tokenExpiry: "1h",
    redisPrefix: "auth:",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MagicLinkServiceImpl(mockConfig);

    // Reset default behavior
    mockRedisUtil.get.mockResolvedValue(null);
    mockRedisUtil.set.mockResolvedValue(true);
    mockRedisUtil.del.mockResolvedValue(true);
    mockRedisUtil.ttl.mockResolvedValue(900);
    mockRedisUtil.exists.mockResolvedValue(true);

    mockGenerateToken.mockResolvedValue("mocked-token");
    mockSendMagicLink.mockResolvedValue(undefined);
  });

  it("should return false when no tokens found for email", async () => {
    mockRedisUtil.get.mockResolvedValueOnce(null); // No email mapping found

    const result = await service.revokeMagicLink("user@example.com");

    expect(result).toBe(false);
    expect(mockRedisUtil.get).toHaveBeenCalledWith(
      "auth:email:user@example.com"
    );
    expect(mockRedisUtil.del).not.toHaveBeenCalled();
  });

  it("should revoke all tokens for an email", async () => {
    const emailTokens = JSON.stringify(["token1", "token2", "token3"]);
    mockRedisUtil.get.mockResolvedValueOnce(emailTokens);

    const result = await service.revokeMagicLink("user@example.com");

    expect(result).toBe(true);

    // Should delete all token keys
    expect(mockRedisUtil.del).toHaveBeenCalledWith("auth:magiclink:token1");
    expect(mockRedisUtil.del).toHaveBeenCalledWith("auth:magiclink:token2");
    expect(mockRedisUtil.del).toHaveBeenCalledWith("auth:magiclink:token3");

    // Should delete the email mapping
    expect(mockRedisUtil.del).toHaveBeenCalledWith(
      "auth:email:user@example.com"
    );

    // Should have been called 4 times total (3 tokens + 1 email mapping)
    expect(mockRedisUtil.del).toHaveBeenCalledTimes(4);
  });

  it("should revoke single token for an email", async () => {
    const emailTokens = JSON.stringify(["single-token"]);
    mockRedisUtil.get.mockResolvedValueOnce(emailTokens);

    const result = await service.revokeMagicLink("user@example.com");

    expect(result).toBe(true);

    // Should delete the token key
    expect(mockRedisUtil.del).toHaveBeenCalledWith(
      "auth:magiclink:single-token"
    );

    // Should delete the email mapping
    expect(mockRedisUtil.del).toHaveBeenCalledWith(
      "auth:email:user@example.com"
    );

    // Should have been called 2 times total (1 token + 1 email mapping)
    expect(mockRedisUtil.del).toHaveBeenCalledTimes(2);
  });

  it("should handle Redis errors during revocation", async () => {
    const emailTokens = JSON.stringify(["token1", "token2"]);
    mockRedisUtil.get.mockResolvedValueOnce(emailTokens);
    mockRedisUtil.del.mockRejectedValueOnce(new Error("Redis deletion failed"));

    await expect(service.revokeMagicLink("user@example.com")).rejects.toThrow(
      "Redis deletion failed"
    );
  });

  it("should handle malformed email tokens data", async () => {
    mockRedisUtil.get.mockResolvedValueOnce("invalid-json");

    await expect(service.revokeMagicLink("user@example.com")).rejects.toThrow();
  });

  it("should handle empty tokens array", async () => {
    const emailTokens = JSON.stringify([]);
    mockRedisUtil.get.mockResolvedValueOnce(emailTokens);

    const result = await service.revokeMagicLink("user@example.com");

    expect(result).toBe(true);

    // Should only delete the email mapping, no token keys
    expect(mockRedisUtil.del).toHaveBeenCalledWith(
      "auth:email:user@example.com"
    );
    expect(mockRedisUtil.del).toHaveBeenCalledTimes(1);
  });
});
