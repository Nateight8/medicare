// Mock dependencies
const mockRequestMagicLink = jest.fn();
const mockRevokeMagicLink = jest.fn();
const mockValidateToken = jest.fn();
const mockStoreAuthRequest = jest.fn();

import { authController } from "../../../../src/auth/controllers/authController";
import { redisUtil } from "../../../../src/lib/redis";
import { MagicLinkServiceImpl } from "../../../../src/auth/services/magicLinkService";

jest.mock("../../../../src/lib/redis", () => ({
  redisUtil: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
}));

jest.mock("../../../../src/auth/services/magicLinkService", () => ({
  MagicLinkServiceImpl: jest.fn().mockImplementation(() => ({
    requestMagicLink: mockRequestMagicLink,
    revokeMagicLink: mockRevokeMagicLink,
    validateToken: mockValidateToken,
    storeAuthRequest: mockStoreAuthRequest,
  })),
}));

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

// helper to mock res
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
});
