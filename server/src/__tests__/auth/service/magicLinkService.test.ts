// src/__tests__/auth/service/magicLinkService.test.ts
import { jest } from "@jest/globals";

// ==========================
// 1️⃣ Mock dependencies BEFORE importing the service
// ==========================

// Mock Redis utility with all methods typed
const mockRedisUtil = {
  set: jest.fn(() => Promise.resolve(true)),
  get: jest.fn(() => Promise.resolve(null)),
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

jest.unstable_mockModule("../../../auth/services/tokenService", () => ({
  JWTTokenService: jest.fn().mockImplementation(() => ({
    generateToken: mockGenerateToken,
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
