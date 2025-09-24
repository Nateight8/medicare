// @ts-nocheck

import crypto from "crypto";
import bcrypt from "bcryptjs";

// Mock dependencies
jest.mock("crypto");
jest.mock("bcryptjs");
jest.mock("@/lib/prisma", () => ({
  refreshToken: {
    create: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
  },
}));

import prisma from "@/lib/prisma";
import { RefreshTokenService } from "@/auth/services/refreshTokenService";

// Type the mocked modules
const mockedCrypto = crypto as jest.Mocked<typeof crypto>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

// Mock types for Prisma
interface MockRefreshToken {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

describe("RefreshTokenService", () => {
  let refreshTokenService: RefreshTokenService;
  const mockUserId = "user-123";
  const mockToken = "mock-random-token-hex-string-40-chars-long";
  const mockTokenHash = "$2a$10$mockhashedtokenvalue";

  beforeEach(() => {
    jest.clearAllMocks();
    refreshTokenService = new RefreshTokenService();

    // Setup default mocks
    (mockedCrypto.randomBytes as jest.Mock).mockReturnValue(
      Buffer.from("mock-bytes")
    );
    (Buffer.prototype.toString as jest.Mock) = jest
      .fn()
      .mockReturnValue(mockToken);
    mockedBcrypt.hash.mockResolvedValue(mockTokenHash as never);
  });

  describe("create", () => {
    const mockCreatedToken: MockRefreshToken = {
      id: "token-id-123",
      tokenHash: mockTokenHash,
      userId: mockUserId,
      expiresAt: new Date("2024-12-01T00:00:00Z"),
      createdAt: new Date("2024-11-24T00:00:00Z"),
      updatedAt: new Date("2024-11-24T00:00:00Z"),
    };

    beforeEach(() => {
      mockedPrisma.refreshToken.create.mockResolvedValue(mockCreatedToken);
      // Mock Date.now() for consistent expiration calculation
      jest
        .spyOn(global.Date, "now")
        .mockImplementation(() => new Date("2024-11-24T00:00:00Z").getTime());
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should create refresh token with default expiry (7 days)", async () => {
      const result = await refreshTokenService.create(mockUserId);

      expect(result).toBe(mockToken);
      expect(mockedCrypto.randomBytes).toHaveBeenCalledWith(40);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(mockToken, 10);

      const expectedExpiresAt = new Date("2024-12-01T00:00:00Z"); // 7 days later

      expect(mockedPrisma.refreshToken.create).toHaveBeenCalledWith({
        data: {
          tokenHash: mockTokenHash,
          userId: mockUserId,
          expiresAt: expectedExpiresAt,
        },
      });
    });

    it("should create refresh token with custom expiry days", async () => {
      const customDays = 14;

      const result = await refreshTokenService.create(mockUserId, customDays);

      expect(result).toBe(mockToken);

      const expectedExpiresAt = new Date("2024-12-08T00:00:00Z"); // 14 days later

      expect(mockedPrisma.refreshToken.create).toHaveBeenCalledWith({
        data: {
          tokenHash: mockTokenHash,
          userId: mockUserId,
          expiresAt: expectedExpiresAt,
        },
      });
    });

    it("should create refresh token with 1 day expiry", async () => {
      const result = await refreshTokenService.create(mockUserId, 1);

      expect(result).toBe(mockToken);

      const expectedExpiresAt = new Date("2024-11-25T00:00:00Z"); // 1 day later

      expect(mockedPrisma.refreshToken.create).toHaveBeenCalledWith({
        data: {
          tokenHash: mockTokenHash,
          userId: mockUserId,
          expiresAt: expectedExpiresAt,
        },
      });
    });

    it("should handle crypto.randomBytes generation", async () => {
      const mockBytes = Buffer.from("different-mock-bytes");
      const differentToken = "different-hex-token";

      mockedCrypto.randomBytes.mockReturnValueOnce(mockBytes);
      mockBytes.toString = jest.fn().mockReturnValue(differentToken);

      const result = await refreshTokenService.create(mockUserId);

      expect(result).toBe(differentToken);
      expect(mockedCrypto.randomBytes).toHaveBeenCalledWith(40);
      expect(mockBytes.toString).toHaveBeenCalledWith("hex");
    });

    it("should handle bcrypt hashing error", async () => {
      const hashError = new Error("Bcrypt hashing failed");
      mockedBcrypt.hash.mockRejectedValue(hashError as never);

      await expect(refreshTokenService.create(mockUserId)).rejects.toThrow(
        "Bcrypt hashing failed"
      );

      expect(mockedPrisma.refreshToken.create).not.toHaveBeenCalled();
    });

    it("should handle database creation error", async () => {
      const dbError = new Error("Database connection failed");
      mockedPrisma.refreshToken.create.mockRejectedValue(dbError);

      await expect(refreshTokenService.create(mockUserId)).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should handle edge case with 0 days expiry", async () => {
      const result = await refreshTokenService.create(mockUserId, 0);

      expect(result).toBe(mockToken);

      // Should expire immediately (same day)
      const expectedExpiresAt = new Date("2024-11-24T00:00:00Z");

      expect(mockedPrisma.refreshToken.create).toHaveBeenCalledWith({
        data: {
          tokenHash: mockTokenHash,
          userId: mockUserId,
          expiresAt: expectedExpiresAt,
        },
      });
    });
  });

  describe("validate", () => {
    const currentDate = new Date("2024-11-24T12:00:00Z");
    const futureDate = new Date("2024-12-01T00:00:00Z");
    const pastDate = new Date("2024-11-20T00:00:00Z");

    beforeEach(() => {
      jest
        .spyOn(global.Date, "now")
        .mockImplementation(() => currentDate.getTime());
      const RealDate = Date;
      global.Date = class extends RealDate {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super(currentDate);
          } else {
            super(...(args as [any]));
          }
        }
        static now() {
          return currentDate.getTime();
        }
      } as any;
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should validate correct token successfully", async () => {
      const mockStoredTokens: MockRefreshToken[] = [
        {
          id: "token-1",
          tokenHash: "hash1",
          userId: mockUserId,
          expiresAt: futureDate,
          createdAt: currentDate,
          updatedAt: currentDate,
        },
        {
          id: "token-2",
          tokenHash: mockTokenHash,
          userId: mockUserId,
          expiresAt: futureDate,
          createdAt: currentDate,
          updatedAt: currentDate,
        },
      ];

      mockedPrisma.refreshToken.findMany.mockResolvedValue(mockStoredTokens);
      mockedBcrypt.compare
        .mockResolvedValueOnce(false) // First token doesn't match
        .mockResolvedValueOnce(true); // Second token matches

      const result = await refreshTokenService.validate(mockToken, mockUserId);

      expect(result).toBe(true);
      expect(mockedPrisma.refreshToken.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          expiresAt: expect.any(Object),
        },
      });
      expect(
        mockedPrisma.refreshToken.findMany.mock.calls[0][0].where.expiresAt.gt.getTime()
      ).toBe(currentDate.getTime());
      expect(mockedBcrypt.compare).toHaveBeenCalledTimes(2);
      expect(mockedBcrypt.compare).toHaveBeenNthCalledWith(
        1,
        mockToken,
        "hash1"
      );
      expect(mockedBcrypt.compare).toHaveBeenNthCalledWith(
        2,
        mockToken,
        mockTokenHash
      );
    });

    it("should return false when no matching token found", async () => {
      const mockStoredTokens: MockRefreshToken[] = [
        {
          id: "token-1",
          tokenHash: "different-hash",
          userId: mockUserId,
          expiresAt: futureDate,
          createdAt: currentDate,
          updatedAt: currentDate,
        },
      ];

      mockedPrisma.refreshToken.findMany.mockResolvedValue(mockStoredTokens);
      mockedBcrypt.compare.mockResolvedValue(false);

      const result = await refreshTokenService.validate(mockToken, mockUserId);

      expect(result).toBe(false);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        mockToken,
        "different-hash"
      );
    });

    it("should return false when no tokens exist for user", async () => {
      mockedPrisma.refreshToken.findMany.mockResolvedValue([]);

      const result = await refreshTokenService.validate(mockToken, mockUserId);

      expect(result).toBe(false);
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it("should only check non-expired tokens", async () => {
      // Mock new Date() calls in the service
      const mockDate = new Date("2024-11-24T12:00:00Z");
      const RealDate = Date;
      global.Date = class extends RealDate {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super(mockDate);
          } else {
            super(...(args as [any]));
          }
        }
        static now() {
          return mockDate.getTime();
        }
      } as any;

      await refreshTokenService.validate(mockToken, mockUserId);

      const findManyCall = mockedPrisma.refreshToken.findMany.mock.calls[0][0];
      expect(findManyCall).toBeDefined();
      expect(findManyCall.where).toBeDefined();
      expect(findManyCall.where.userId).toBe(mockUserId);
      expect(findManyCall.where.expiresAt).toBeDefined();
      expect(findManyCall.where.expiresAt.gt).toBeInstanceOf(Date);
    });

    it("should handle database query error", async () => {
      const dbError = new Error("Database query failed");
      mockedPrisma.refreshToken.findMany.mockRejectedValue(dbError);

      await expect(
        refreshTokenService.validate(mockToken, mockUserId)
      ).rejects.toThrow("Database query failed");
    });

    it("should handle bcrypt comparison error", async () => {
      const mockStoredTokens: MockRefreshToken[] = [
        {
          id: "token-1",
          tokenHash: mockTokenHash,
          userId: mockUserId,
          expiresAt: futureDate,
          createdAt: currentDate,
          updatedAt: currentDate,
        },
      ];

      mockedPrisma.refreshToken.findMany.mockResolvedValue(mockStoredTokens);
      mockedBcrypt.compare.mockRejectedValue(
        new Error("Bcrypt compare failed")
      );

      await expect(
        refreshTokenService.validate(mockToken, mockUserId)
      ).rejects.toThrow("Bcrypt compare failed");
    });

    it("should handle multiple tokens with first one matching", async () => {
      const mockStoredTokens: MockRefreshToken[] = [
        {
          id: "token-1",
          tokenHash: mockTokenHash,
          userId: mockUserId,
          expiresAt: futureDate,
          createdAt: currentDate,
          updatedAt: currentDate,
        },
        {
          id: "token-2",
          tokenHash: "hash2",
          userId: mockUserId,
          expiresAt: futureDate,
          createdAt: currentDate,
          updatedAt: currentDate,
        },
      ];

      mockedPrisma.refreshToken.findMany.mockResolvedValue(mockStoredTokens);
      mockedBcrypt.compare.mockResolvedValueOnce(true); // First token matches

      const result = await refreshTokenService.validate(mockToken, mockUserId);

      expect(result).toBe(true);
      expect(mockedBcrypt.compare).toHaveBeenCalledTimes(1); // Should stop after first match
    });
  });

  describe("revoke", () => {
    const mockStoredTokens: MockRefreshToken[] = [
      {
        id: "token-1",
        tokenHash: "hash1",
        userId: mockUserId,
        expiresAt: new Date("2024-12-01T00:00:00Z"),
        createdAt: new Date("2024-11-24T00:00:00Z"),
        updatedAt: new Date("2024-11-24T00:00:00Z"),
      },
      {
        id: "token-2",
        tokenHash: mockTokenHash,
        userId: mockUserId,
        expiresAt: new Date("2024-12-01T00:00:00Z"),
        createdAt: new Date("2024-11-24T00:00:00Z"),
        updatedAt: new Date("2024-11-24T00:00:00Z"),
      },
    ];

    it("should revoke matching token successfully", async () => {
      mockedPrisma.refreshToken.findMany.mockResolvedValue(mockStoredTokens);
      mockedPrisma.refreshToken.delete.mockResolvedValue(mockStoredTokens[1]);
      mockedBcrypt.compare
        .mockResolvedValueOnce(false) // First token doesn't match
        .mockResolvedValueOnce(true); // Second token matches

      await refreshTokenService.revoke(mockToken, mockUserId);

      expect(mockedPrisma.refreshToken.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledTimes(2);
      expect(mockedPrisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { id: "token-2" },
      });
    });

    it("should not delete anything when no matching token found", async () => {
      mockedPrisma.refreshToken.findMany.mockResolvedValue(mockStoredTokens);
      mockedBcrypt.compare.mockResolvedValue(false); // No tokens match

      await refreshTokenService.revoke(mockToken, mockUserId);

      expect(mockedBcrypt.compare).toHaveBeenCalledTimes(2);
      expect(mockedPrisma.refreshToken.delete).not.toHaveBeenCalled();
    });

    it("should handle case when user has no tokens", async () => {
      mockedPrisma.refreshToken.findMany.mockResolvedValue([]);

      await refreshTokenService.revoke(mockToken, mockUserId);

      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
      expect(mockedPrisma.refreshToken.delete).not.toHaveBeenCalled();
    });

    it("should revoke first matching token and continue checking others", async () => {
      // Simulate case where same token might be stored multiple times (edge case)
      const duplicateTokens: MockRefreshToken[] = [
        {
          id: "token-1",
          tokenHash: mockTokenHash,
          userId: mockUserId,
          expiresAt: new Date("2024-12-01T00:00:00Z"),
          createdAt: new Date("2024-11-24T00:00:00Z"),
          updatedAt: new Date("2024-11-24T00:00:00Z"),
        },
        {
          id: "token-2",
          tokenHash: mockTokenHash,
          userId: mockUserId,
          expiresAt: new Date("2024-12-01T00:00:00Z"),
          createdAt: new Date("2024-11-24T00:00:00Z"),
          updatedAt: new Date("2024-11-24T00:00:00Z"),
        },
      ];

      mockedPrisma.refreshToken.findMany.mockResolvedValue(duplicateTokens);
      mockedPrisma.refreshToken.delete
        .mockResolvedValueOnce(duplicateTokens[0])
        .mockResolvedValueOnce(duplicateTokens[1]);
      mockedBcrypt.compare.mockResolvedValue(true); // Both match

      await refreshTokenService.revoke(mockToken, mockUserId);

      expect(mockedBcrypt.compare).toHaveBeenCalledTimes(2);
      expect(mockedPrisma.refreshToken.delete).toHaveBeenCalledTimes(2);
      expect(mockedPrisma.refreshToken.delete).toHaveBeenNthCalledWith(1, {
        where: { id: "token-1" },
      });
      expect(mockedPrisma.refreshToken.delete).toHaveBeenNthCalledWith(2, {
        where: { id: "token-2" },
      });
    });

    it("should handle database query error during findMany", async () => {
      const dbError = new Error("Database query failed");
      mockedPrisma.refreshToken.findMany.mockRejectedValue(dbError);

      await expect(
        refreshTokenService.revoke(mockToken, mockUserId)
      ).rejects.toThrow("Database query failed");
    });

    it("should handle database deletion error", async () => {
      mockedPrisma.refreshToken.findMany.mockResolvedValue([
        mockStoredTokens[1],
      ]);
      mockedBcrypt.compare.mockResolvedValue(true);

      const deleteError = new Error("Database deletion failed");
      mockedPrisma.refreshToken.delete.mockRejectedValue(deleteError);

      await expect(
        refreshTokenService.revoke(mockToken, mockUserId)
      ).rejects.toThrow("Database deletion failed");
    });

    it("should handle bcrypt comparison error during revoke", async () => {
      mockedPrisma.refreshToken.findMany.mockResolvedValue(mockStoredTokens);
      mockedBcrypt.compare.mockRejectedValue(
        new Error("Bcrypt compare failed")
      );

      await expect(
        refreshTokenService.revoke(mockToken, mockUserId)
      ).rejects.toThrow("Bcrypt compare failed");
    });
  });

  describe("integration scenarios", () => {
    it("should handle complete token lifecycle", async () => {
      // Setup mocks for creation
      const mockCreatedToken: MockRefreshToken = {
        id: "lifecycle-token-id",
        tokenHash: mockTokenHash,
        userId: mockUserId,
        expiresAt: new Date("2024-12-01T00:00:00Z"),
        createdAt: new Date("2024-11-24T00:00:00Z"),
        updatedAt: new Date("2024-11-24T00:00:00Z"),
      };

      jest
        .spyOn(global.Date, "now")
        .mockImplementation(() => new Date("2024-11-24T00:00:00Z").getTime());
      mockedPrisma.refreshToken.create.mockResolvedValue(mockCreatedToken);

      // Create token
      const token = await refreshTokenService.create(mockUserId);
      expect(token).toBe(mockToken);

      // Setup mocks for validation
      const RealDate = Date;
      global.Date = class extends RealDate {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super("2024-11-25T00:00:00Z");
          } else {
            super(...(args as [any]));
          }
        }
        static now() {
          return new Date("2024-11-25T00:00:00Z").getTime();
        }
      } as any;

      mockedPrisma.refreshToken.findMany.mockResolvedValue([mockCreatedToken]);
      mockedBcrypt.compare.mockResolvedValue(true);

      // Validate token
      const isValid = await refreshTokenService.validate(token, mockUserId);
      expect(isValid).toBe(true);

      // Setup mocks for revocation
      mockedPrisma.refreshToken.findMany.mockResolvedValue([mockCreatedToken]);
      mockedPrisma.refreshToken.delete.mockResolvedValue(mockCreatedToken);
      mockedBcrypt.compare.mockResolvedValue(true);

      // Revoke token
      await expect(
        refreshTokenService.revoke(token, mockUserId)
      ).resolves.not.toThrow();

      expect(mockedPrisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { id: "lifecycle-token-id" },
      });
    });

    it("should handle multiple users independently", async () => {
      const user1Id = "user-1";
      const user2Id = "user-2";
      const token1 = "token-for-user-1";
      const token2 = "token-for-user-2";

      // Mock the buffer to return different tokens on consecutive calls
      const mockBuffer1 = {
        toString: jest
          .fn()
          .mockReturnValueOnce(token1)
          .mockReturnValueOnce(token2),
      };

      mockedCrypto.randomBytes
        .mockReturnValueOnce(mockBuffer1 as any)
        .mockReturnValueOnce(mockBuffer1 as any);

      mockedBcrypt.hash
        .mockResolvedValueOnce("hash-user-1")
        .mockResolvedValueOnce("hash-user-2");

      mockedPrisma.refreshToken.create.mockResolvedValue({} as any);
      jest
        .spyOn(global.Date, "now")
        .mockImplementation(() => new Date("2024-11-24T00:00:00Z").getTime());

      const result1 = await refreshTokenService.create(user1Id);
      const result2 = await refreshTokenService.create(user2Id);

      expect(result1).toBe(token1);
      expect(result2).toBe(token2);
      expect(mockedPrisma.refreshToken.create).toHaveBeenCalledTimes(2);
    });
  });

  describe("edge cases and security", () => {
    it("should handle very long user IDs", async () => {
      const longUserId = "a".repeat(1000);
      jest
        .spyOn(global.Date, "now")
        .mockImplementation(() => new Date("2024-11-24T00:00:00Z").getTime());
      mockedPrisma.refreshToken.create.mockResolvedValue({} as any);

      const result = await refreshTokenService.create(longUserId);

      // The mock always returns the same token value
      expect(result).toBe(mockToken);
      expect(mockedPrisma.refreshToken.create).toHaveBeenCalledWith({
        data: {
          tokenHash: mockTokenHash,
          userId: longUserId,
          expiresAt: expect.any(Date),
        },
      });
    });

    it("should handle special characters in tokens", async () => {
      const specialToken = "token-with-special-chars-@#$%^&*()";
      mockedPrisma.refreshToken.findMany.mockResolvedValue([
        {
          id: "special-token-id",
          tokenHash: "special-hash",
          userId: mockUserId,
          expiresAt: new Date("2024-12-01T00:00:00Z"),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      mockedBcrypt.compare.mockResolvedValue(true);

      const result = await refreshTokenService.validate(
        specialToken,
        mockUserId
      );

      expect(result).toBe(true);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        specialToken,
        "special-hash"
      );
    });
  });
});
