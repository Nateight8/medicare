// tests/auth/controllers/authController.test.ts

// Set up test environment variables
process.env.WEB_APP_URL = "http://localhost:3000";

// Mock useragent module
jest.mock("useragent", () => ({
  parse: jest.fn().mockImplementation((ua) => ({
    device: {
      toString: () => (ua.includes("iPhone") ? "mobile" : "Other"),
    },
  })),
}));

// ---- Manual mocks for MagicLinkServiceImpl ----
const mockRequestMagicLink = jest.fn();
const mockRevokeMagicLink = jest.fn();
const mockValidateToken = jest.fn();
const mockStoreAuthRequest = jest.fn();

import { authController } from "../../../../src/auth/controllers/authController";
import { redisUtil } from "../../../../src/lib/redis";
import { MagicLinkServiceImpl } from "../../../../src/auth/services/magicLinkService";
import prisma from "../../../../src/lib/prisma";

// ---- Mock Redis ----
jest.mock("../../../../src/lib/redis", () => ({
  redisUtil: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
}));

// ---- Mock MagicLinkService ----
jest.mock("../../../../src/auth/services/magicLinkService", () => ({
  MagicLinkServiceImpl: jest.fn().mockImplementation(() => ({
    requestMagicLink: mockRequestMagicLink,
    revokeMagicLink: mockRevokeMagicLink,
    validateToken: mockValidateToken,
    storeAuthRequest: mockStoreAuthRequest,
  })),
}));

// ---- Mock Prisma ----
jest.mock("../../../../src/lib/prisma", () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
}));

// ---- helper to mock res ----
const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  return res;
};

describe("authController", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {}, query: {}, headers: {}, cookies: {} };
    res = mockResponse();
  });

  // ---------------------------
  // sendMagicLink
  // ---------------------------
  describe("sendMagicLink", () => {
    it("should return 400 if no email is provided", async () => {
      await authController.sendMagicLink(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Email is required" });
    });

    it("should send magic link and return 200", async () => {
      req.body.email = "test@example.com";
      (redisUtil.set as jest.Mock).mockResolvedValue(true);
      mockRequestMagicLink.mockResolvedValue({ expiresIn: "5m" });

      await authController.sendMagicLink(req, res);

      expect(redisUtil.set).toHaveBeenCalledWith(
        "auth:status:test@example.com",
        "pending",
        900
      );
      expect(mockRequestMagicLink).toHaveBeenCalledWith("test@example.com");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Magic link sent!",
        success: true,
        expiresIn: "5m",
      });
    });

    it("should handle errors gracefully", async () => {
      req.body.email = "test@example.com";
      (redisUtil.set as jest.Mock).mockRejectedValue(new Error("Redis down"));

      await authController.sendMagicLink(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to send magic link",
        success: false,
      });
    });
  });

  // ---------------------------
  // revokeAuth
  // ---------------------------
  describe("revokeAuth", () => {
    it("should return 400 if no email provided", async () => {
      await authController.revokeAuth(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Email is required" });
    });

    it("should revoke magic link and clear status", async () => {
      req.body.email = "test@example.com";
      mockRevokeMagicLink.mockResolvedValue(true);
      (redisUtil.del as jest.Mock).mockResolvedValue(1);

      await authController.revokeAuth(req, res);

      expect(mockRevokeMagicLink).toHaveBeenCalledWith("test@example.com");
      expect(redisUtil.del).toHaveBeenCalledWith(
        "auth:status:test@example.com"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Magic link revoked!",
        success: true,
        revoked: true,
      });
    });

    it("should handle service errors", async () => {
      req.body.email = "test@example.com";
      mockRevokeMagicLink.mockRejectedValue(new Error("fail revoke"));

      await authController.revokeAuth(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to revoke magic link",
        success: false,
      });
    });
  });

  // ---------------------------
  // validateMagicLink
  // ---------------------------
  describe("validateMagicLink", () => {
    it("should redirect to error if token is missing", async () => {
      req.query = {};

      await authController.validateMagicLink(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.WEB_APP_URL}/auth/error?reason=invalid_token`
      );
    });

    it("should redirect to expired error if token is expired", async () => {
      req.query.token = "expired-token";
      mockValidateToken.mockResolvedValue({ payload: null, error: "expired" });

      await authController.validateMagicLink(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.WEB_APP_URL}/auth/error?reason=expired_token`
      );
    });

    it("should redirect to used token error if already used", async () => {
      req.query.token = "used-token";
      mockValidateToken.mockResolvedValue({
        payload: null,
        error: "used_or_revoked",
      });

      await authController.validateMagicLink(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.WEB_APP_URL}/auth/error?reason=used_token`
      );
    });

    it("should redirect to invalid error if payload is missing", async () => {
      req.query.token = "invalid-token";
      mockValidateToken.mockResolvedValue({ payload: null, error: "invalid" });

      await authController.validateMagicLink(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.WEB_APP_URL}/auth/error?reason=invalid_token`
      );
    });

    it("should create user if not found and redirect mobile deep link", async () => {
      req.query.token = "valid-token";
      // Use a more specific mobile user agent string
      req.headers["user-agent"] =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1";

      // Mock the token validation
      mockValidateToken.mockResolvedValue({
        payload: { email: "mobile@example.com" },
        error: null,
      });

      // Mock Redis set call
      (redisUtil.set as jest.Mock).mockResolvedValue(true);

      // Mock Prisma calls
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      (prisma.user.create as jest.Mock).mockResolvedValueOnce({
        id: "123",
        email: "mobile@example.com",
      });

      await authController.validateMagicLink(req, res);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { email: "mobile@example.com" },
      });
      expect(res.redirect).toHaveBeenCalledWith(
        `yourapp://auth/verify?token=${encodeURIComponent("valid-token")}`
      );
    });

    it("should redirect to QR page for desktop", async () => {
      req.query.token = "valid-token";
      req.headers["user-agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";

      // Mock the token validation
      mockValidateToken.mockResolvedValue({
        payload: { email: "desktop@example.com" },
        error: null,
      });

      // Mock Redis set call
      (redisUtil.set as jest.Mock).mockResolvedValue(true);

      // Mock Prisma calls
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: "456",
        email: "desktop@example.com",
      });

      // Mock the auth request storage
      mockStoreAuthRequest.mockResolvedValue("req-123");

      await authController.validateMagicLink(req, res);

      expect(redisUtil.set).toHaveBeenCalledWith(
        "auth:status:desktop@example.com",
        "validated",
        900
      );
      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.WEB_APP_URL}/auth/qr?requestId=req-123`
      );
    });

    it("should handle internal errors gracefully", async () => {
      req.query.token = "valid-token";
      mockValidateToken.mockRejectedValue(new Error("boom"));

      await authController.validateMagicLink(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to validate token",
        success: false,
      });
    });
  });

  // ---------------------------
  // continueOnDevice
  // ---------------------------
});
