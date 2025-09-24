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

// Manual mocks
const mockRequestMagicLink = jest.fn();
const mockRevokeMagicLink = jest.fn();
const mockValidateToken = jest.fn();
const mockStoreAuthRequest = jest.fn();
const mockTokenService = {
  generateToken: jest.fn().mockResolvedValue("mock-token"),
};

// Mock MagicLinkService before importing the controller
jest.mock("../../../../src/auth/services/magicLinkService", () => {
  return {
    MagicLinkServiceImpl: jest.fn().mockImplementation(() => ({
      requestMagicLink: mockRequestMagicLink,
      revokeMagicLink: mockRevokeMagicLink,
      validateToken: mockValidateToken,
      storeAuthRequest: mockStoreAuthRequest,
      tokenService: mockTokenService,
    })),
  };
});

// Import after mocks to ensure they're available
import { authController } from "../../../../src/auth/controllers/authController";
import { redisUtil } from "../../../../src/lib/redis";
import { MagicLinkServiceImpl } from "../../../../src/auth/services/magicLinkService";

// Declare magicLinkService variable
let magicLinkService: jest.Mocked<MagicLinkServiceImpl>;
import prisma from "../../../../src/lib/prisma";

// Mock Redis
jest.mock("../../../../src/lib/redis", () => ({
  redisUtil: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
}));

beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();

  // Reset the mock implementation
  mockTokenService.generateToken.mockResolvedValue("mock-token");
});

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
  describe("continueOnDevice", () => {
    it("should return 400 if no requestId is provided", async () => {
      req.body = {}; // no requestId

      await authController.continueOnDevice(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Missing or invalid requestId",
      });
    });

    it("should return 400 if request not found in redis", async () => {
      req.body = { requestId: "req-123" };
      (redisUtil.get as jest.Mock).mockResolvedValue(null);

      await authController.continueOnDevice(req, res);

      expect(redisUtil.get).toHaveBeenCalledWith("auth:qr:req-123");
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid or expired session",
      });
    });

    it("should return 404 if user not found in database", async () => {
      req.body = { requestId: "req-123" };
      (redisUtil.get as jest.Mock).mockResolvedValue("user-123");
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await authController.continueOnDevice(req, res);

      expect(redisUtil.get).toHaveBeenCalledWith("auth:qr:req-123");
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-123" },
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "User not found",
      });
    });

    it("should return success with user data if validation passes", async () => {
      const mockUser = {
        id: "u-123",
        email: "test@example.com",
        phone: "1234567890",
        name: "Test User",
        timeZone: "UTC",
        createdAt: new Date(),
        updatedAt: new Date(),
        onboarded: false,
      };

      req.body = { requestId: "req-123" };
      (redisUtil.get as jest.Mock).mockResolvedValue("u-123");
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({
        id: "rt-123",
        tokenHash: "hashed-token",
      });
      (redisUtil.del as jest.Mock).mockResolvedValue(1); // <-- must mock this

      // Get the mocked instance of MagicLinkServiceImpl
      magicLinkService = (MagicLinkServiceImpl as jest.Mock).mock.results[0]
        ?.value as jest.Mocked<MagicLinkServiceImpl>;

      await authController.continueOnDevice(req, res);

      expect(redisUtil.get).toHaveBeenCalledWith("auth:qr:req-123");
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "u-123" },
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          phone: mockUser.phone,
          name: mockUser.name,
          timeZone: mockUser.timeZone,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
          onboarded: mockUser.onboarded,
        },
      });
      expect(res.cookie).toHaveBeenCalledWith(
        "auth_token",
        "mock-token",
        expect.any(Object)
      );
      expect(res.cookie).toHaveBeenCalledWith(
        "refresh_token",
        expect.any(String),
        expect.any(Object)
      );
      expect(redisUtil.del).toHaveBeenCalledTimes(2); // session key + auth status
    });

    it("should handle internal errors gracefully", async () => {
      req.body = { requestId: "req-123" };
      (redisUtil.get as jest.Mock).mockRejectedValue(new Error("redis crash"));

      await authController.continueOnDevice(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Internal server error",
      });
    });
  });

  // ---------------------------
  // pollAuthStatus
  // ---------------------------
  describe("pollAuthStatus", () => {
    it("should return 'pending' when redis has pending status", async () => {
      req.body.email = "test@example.com";
      (redisUtil.get as jest.Mock).mockResolvedValue("pending");

      await authController.pollAuthStatus(req, res);

      expect(redisUtil.get).toHaveBeenCalledWith(
        "auth:status:test@example.com"
      );
      expect(res.json).toHaveBeenCalledWith({ status: "pending" });
    });

    it("should return 'validated' when redis has validated status", async () => {
      req.body.email = "test@example.com";
      (redisUtil.get as jest.Mock).mockResolvedValue("validated");

      await authController.pollAuthStatus(req, res);

      expect(redisUtil.get).toHaveBeenCalledWith(
        "auth:status:test@example.com"
      );
      expect(res.json).toHaveBeenCalledWith({ status: "validated" });
    });

    it("should return 'not_started' when redis has no status", async () => {
      req.body.email = "test@example.com";
      (redisUtil.get as jest.Mock).mockResolvedValue(null);

      await authController.pollAuthStatus(req, res);

      expect(redisUtil.get).toHaveBeenCalledWith(
        "auth:status:test@example.com"
      );
      expect(res.json).toHaveBeenCalledWith({ status: "not_started" });
    });

    it("should handle redis errors gracefully", async () => {
      req.body.email = "test@example.com";
      (redisUtil.get as jest.Mock).mockRejectedValue(new Error("redis fail"));

      await authController.pollAuthStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Internal server error",
      });
    });
  });

  // ---------------------------
  // getAuthStatus
  // ---------------------------
  describe("getAuthStatus", () => {
    it("should return status from redis if exists", async () => {
      req.query.email = "test@example.com";
      (redisUtil.get as jest.Mock).mockResolvedValue("validated");

      await authController.getAuthStatus(req, res);

      expect(redisUtil.get).toHaveBeenCalledWith(
        "auth:status:test@example.com"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: "validated",
        success: true,
      });
    });

    it("should return 'not_started' if redis returns null", async () => {
      req.query.email = "test@example.com";
      (redisUtil.get as jest.Mock).mockResolvedValue(null);

      await authController.getAuthStatus(req, res);

      expect(redisUtil.get).toHaveBeenCalledWith(
        "auth:status:test@example.com"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: "not_started",
        success: true,
      });
    });

    it("should return 400 if email is missing", async () => {
      req.query = {}; // no email

      await authController.getAuthStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Email is required" });
    });

    it("should return 500 if redis throws an error", async () => {
      req.query.email = "test@example.com";
      (redisUtil.get as jest.Mock).mockRejectedValue(new Error("Redis down"));

      await authController.getAuthStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to get auth status",
        success: false,
      });
    });
  });

  describe("refreshToken", () => {
    it("should return 401 if no refresh token is provided", async () => {
      req.cookies = {}; // no refresh_token

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "No refresh token provided",
      });
    });

    it("should return 401 if token not found in DB", async () => {
      const refreshTokenValue = "refresh-token-123";
      req.cookies = { refresh_token: refreshTokenValue };

      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(null);

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid or expired refresh token",
      });
    });

    it("should return 401 if token is expired", async () => {
      const refreshTokenValue = "refresh-token-123";
      req.cookies = { refresh_token: refreshTokenValue };

      const expiredToken = {
        id: "rt-123",
        tokenHash: "hashed-token",
        expiresAt: new Date(Date.now() - 1000), // expired
        user: { id: "u-123", email: "test@example.com" },
      };
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(
        expiredToken
      );

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid or expired refresh token",
      });
    });

    it("should generate new tokens and set cookies", async () => {
      const refreshTokenValue = "refresh-token-123";
      req.cookies = { refresh_token: refreshTokenValue };

      const storedToken = {
        id: "rt-123",
        tokenHash: "hashed-token",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // valid
        user: { id: "u-123", email: "test@example.com" },
      };
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(
        storedToken
      );
      (prisma.$transaction as jest.Mock).mockResolvedValue([
        {}, // delete result
        {}, // create result
      ]);

      // Set up the mock for this specific test
      mockTokenService.generateToken.mockResolvedValue("new-access-token");

      await authController.refreshToken(req, res);

      expect(mockTokenService.generateToken).toHaveBeenCalledWith(
        { userId: "u-123", email: "test@example.com", type: "refresh" },
        { expiresIn: process.env.JWT_EXPIRY || "1h" }
      );

      expect(prisma.$transaction).toHaveBeenCalled();

      expect(res.cookie).toHaveBeenCalledWith(
        "auth_token",
        "new-access-token",
        expect.any(Object)
      );
      expect(res.cookie).toHaveBeenCalledWith(
        "refresh_token",
        expect.any(String),
        expect.any(Object)
      );

      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it("should handle internal errors gracefully", async () => {
      req.cookies = { refresh_token: "refresh-token-123" };
      (prisma.refreshToken.findUnique as jest.Mock).mockRejectedValue(
        new Error("DB down")
      );

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
    });
  });
});
