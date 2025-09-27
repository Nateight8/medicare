// src/__tests__/auth/controllers/authController.test.ts
import { jest } from "@jest/globals";
import { Request, Response } from "express";

// ==========================
// 1️⃣ Mock dependencies BEFORE importing the controller
// ==========================

// Mock Redis utility
const mockRedisUtil = {
  set: jest.fn(() => Promise.resolve(true)),
  get: jest.fn(() => Promise.resolve<string | null>(null)),
  del: jest.fn(() => Promise.resolve(true)),
  ttl: jest.fn(() => Promise.resolve(900)),
  exists: jest.fn(() => Promise.resolve(true)),
};
jest.unstable_mockModule("../../../../lib/redis", () => ({
  redisUtil: mockRedisUtil,
}));

// Mock MagicLinkService
const mockRequestMagicLink = jest.fn(() =>
  Promise.resolve({ expiresIn: "1h" })
);
jest.unstable_mockModule("../../../services/magicLinkService", () => ({
  MagicLinkServiceImpl: jest.fn().mockImplementation(() => ({
    requestMagicLink: mockRequestMagicLink,
  })),
}));

// Mock magicLinkConfig
jest.unstable_mockModule("../../../config/magicLinkConfig", () => ({
  magicLinkConfig: {
    magicLinkBaseUrl: "https://app.test",
    jwtSecret: "test-secret",
    tokenExpiry: "1h",
    redisPrefix: "auth:",
  },
}));

// ==========================
// 2️⃣ Import modules AFTER mocks
// ==========================
const { authController } = await import("../../../controllers/authController");

// ==========================
// 3️⃣ Test suite
// ==========================
describe("AuthController - sendMagicLink", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mocks
    mockRedisUtil.set.mockResolvedValue(true);
    mockRequestMagicLink.mockResolvedValue({ expiresIn: "1h" });

    // Mock response methods
    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnThis();

    mockReq = {
      body: {},
    };

    mockRes = {
      status: mockStatus,
      json: mockJson,
    };
  });

  it("should send magic link successfully", async () => {
    mockReq.body = { email: "user@example.com" };

    await authController.sendMagicLink(mockReq as Request, mockRes as Response);

    // Should set pending status in Redis
    expect(mockRedisUtil.set).toHaveBeenCalledWith(
      "auth:status:user@example.com",
      "pending",
      900 // 15 minutes = 900 seconds
    );

    // Should call magic link service
    expect(mockRequestMagicLink).toHaveBeenCalledWith("user@example.com");

    // Should return success response
    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      message: "Magic link sent!",
      success: true,
      expiresIn: "1h",
    });
  });

  it("should return 400 when email is missing", async () => {
    mockReq.body = {};

    await authController.sendMagicLink(mockReq as Request, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      error: "Email is required",
    });

    // Should not call Redis or service
    expect(mockRedisUtil.set).not.toHaveBeenCalled();
    expect(mockRequestMagicLink).not.toHaveBeenCalled();
  });

  it("should return 400 when email is empty string", async () => {
    mockReq.body = { email: "" };

    await authController.sendMagicLink(mockReq as Request, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      error: "Email is required",
    });
  });

  it("should return 400 when email is null", async () => {
    mockReq.body = { email: null };

    await authController.sendMagicLink(mockReq as Request, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      error: "Email is required",
    });
  });

  it("should return 400 when email is undefined", async () => {
    mockReq.body = { email: undefined };

    await authController.sendMagicLink(mockReq as Request, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      error: "Email is required",
    });
  });

  it("should handle Redis errors gracefully", async () => {
    mockReq.body = { email: "user@example.com" };
    mockRedisUtil.set.mockRejectedValueOnce(
      new Error("Redis connection failed")
    );

    await authController.sendMagicLink(mockReq as Request, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      error: "Failed to send magic link",
      success: false,
    });

    // Should not call service if Redis fails
    expect(mockRequestMagicLink).not.toHaveBeenCalled();
  });

  it("should handle magic link service errors gracefully", async () => {
    mockReq.body = { email: "user@example.com" };
    mockRequestMagicLink.mockRejectedValueOnce(
      new Error("Email service failed")
    );

    await authController.sendMagicLink(mockReq as Request, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      error: "Failed to send magic link",
      success: false,
    });

    // Should still set pending status even if service fails
    expect(mockRedisUtil.set).toHaveBeenCalledWith(
      "auth:status:user@example.com",
      "pending",
      900
    );
  });

  it("should handle both Redis and service errors", async () => {
    mockReq.body = { email: "user@example.com" };
    mockRedisUtil.set.mockRejectedValueOnce(new Error("Redis failed"));
    mockRequestMagicLink.mockRejectedValueOnce(new Error("Service failed"));

    await authController.sendMagicLink(mockReq as Request, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      error: "Failed to send magic link",
      success: false,
    });
  });

  it("should work with different email formats", async () => {
    const testEmails = [
      "test@example.com",
      "user.name@domain.co.uk",
      "user+tag@example.org",
      "123@test.com",
    ];

    for (const email of testEmails) {
      jest.clearAllMocks();
      mockReq.body = { email };

      await authController.sendMagicLink(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockRedisUtil.set).toHaveBeenCalledWith(
        `auth:status:${email}`,
        "pending",
        900
      );
      expect(mockRequestMagicLink).toHaveBeenCalledWith(email);
    }
  });

  it("should handle magic link service returning different expiry times", async () => {
    mockReq.body = { email: "user@example.com" };
    mockRequestMagicLink.mockResolvedValueOnce({ expiresIn: "30m" });

    await authController.sendMagicLink(mockReq as Request, mockRes as Response);

    expect(mockJson).toHaveBeenCalledWith({
      message: "Magic link sent!",
      success: true,
      expiresIn: "30m",
    });
  });
});
