import { GraphQLError } from "graphql";

import { isValidIANA } from "@/graphql/utils/time-zone";
import { createHash } from "crypto";
import { GraphqlContext } from "@/graphql/context";
import { userResolvers } from "@/graphql/resolvers/user";

// Mock dependencies
jest.mock("@/graphql/utils/time-zone");
jest.mock("@/lib/redis");
jest.mock("crypto");

const mockIsValidIANA = isValidIANA as jest.MockedFunction<typeof isValidIANA>;
const mockCreateHash = createHash as jest.MockedFunction<typeof createHash>;

describe("userResolvers", () => {
  let mockContext: jest.Mocked<GraphqlContext>;
  let mockPrisma: any;
  let mockRes: any;
  let mockReq: any;

  beforeEach(() => {
    // Reset all mocks
    jest.resetAllMocks();

    // Mock Prisma client
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      doseEvent: {
        deleteMany: jest.fn(),
      },
      prescription: {
        deleteMany: jest.fn(),
      },
      refreshToken: {
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    // Mock response object
    mockRes = {
      clearCookie: jest.fn(),
    };

    // Mock request object
    mockReq = {
      cookies: {},
    };

    // Mock GraphQL context
    mockContext = {
      user: { id: "user-123" },
      prisma: mockPrisma,
      res: mockRes,
      req: mockReq,
    } as jest.Mocked<GraphqlContext>;
  });

  describe("Query.me", () => {
    const mockUser = {
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
      phone: "+1234567890",
      timeZone: "America/New_York",
      onboarded: true,
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-01-02"),
    };

    it("should return user data when authenticated", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userResolvers.Query.me(null, {}, mockContext);

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-123" },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          timeZone: true,
          onboarded: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it("should throw UNAUTHENTICATED error when user is not authenticated", async () => {
      mockContext.user = null;

      await expect(
        userResolvers.Query.me(null, {}, mockContext)
      ).rejects.toThrow(
        new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        })
      );

      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("should throw UNAUTHENTICATED error when user id is missing", async () => {
      mockContext.user = { id: "", email: "" };

      await expect(
        userResolvers.Query.me(null, {}, mockContext)
      ).rejects.toThrow(
        new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        })
      );
    });

    it("should throw NOT_FOUND error when user does not exist", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        userResolvers.Query.me(null, {}, mockContext)
      ).rejects.toThrow(
        new GraphQLError("User not found", {
          extensions: { code: "NOT_FOUND" },
        })
      );
    });
  });

  describe("Mutation.deleteAccount", () => {
    it("should successfully delete account and clear cookies", async () => {
      mockPrisma.$transaction.mockResolvedValue([]);

      const result = await userResolvers.Mutation.deleteAccount(
        null,
        {},
        mockContext
      );

      expect(result).toEqual({ success: true });
      expect(mockPrisma.$transaction).toHaveBeenCalledWith([
        mockPrisma.doseEvent.deleteMany({ where: { userId: "user-123" } }),
        mockPrisma.prescription.deleteMany({ where: { userId: "user-123" } }),
        mockPrisma.refreshToken.deleteMany({ where: { userId: "user-123" } }),
        mockPrisma.user.delete({ where: { id: "user-123" } }),
      ]);

      expect(mockRes.clearCookie).toHaveBeenCalledWith("auth_token", {
        httpOnly: true,
        secure: false, // NODE_ENV is not production in tests
        sameSite: "lax",
      });
      expect(mockRes.clearCookie).toHaveBeenCalledWith("refresh_token", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      });
    });

    it("should use secure cookies in production", async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";
      mockPrisma.$transaction.mockResolvedValue([]);

      await userResolvers.Mutation.deleteAccount(null, {}, mockContext);

      expect(mockRes.clearCookie).toHaveBeenCalledWith("auth_token", {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
      });

      process.env.NODE_ENV = originalNodeEnv;
    });

    it("should throw UNAUTHENTICATED error when user is not authenticated", async () => {
      mockContext.user = null;

      await expect(
        userResolvers.Mutation.deleteAccount(null, {}, mockContext)
      ).rejects.toThrow(
        new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        })
      );

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it("should handle database errors gracefully", async () => {
      const dbError = new Error("Database connection failed");
      mockPrisma.$transaction.mockRejectedValue(dbError);

      await expect(
        userResolvers.Mutation.deleteAccount(null, {}, mockContext)
      ).rejects.toThrow(
        new GraphQLError("Failed to delete account", {
          extensions: {
            code: "INTERNAL_SERVER_ERROR",
            details: "Database connection failed",
          },
        })
      );
    });

    it("should handle non-Error exceptions", async () => {
      mockPrisma.$transaction.mockRejectedValue("String error");

      await expect(
        userResolvers.Mutation.deleteAccount(null, {}, mockContext)
      ).rejects.toThrow(
        new GraphQLError("Failed to delete account", {
          extensions: {
            code: "INTERNAL_SERVER_ERROR",
            details: "Unknown error",
          },
        })
      );
    });
  });

  describe("Mutation.updateAccount", () => {
    const mockExistingUser = {
      name: "Existing User",
      onboarded: false,
    };

    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue(mockExistingUser);
      mockPrisma.user.update.mockResolvedValue({});
      mockIsValidIANA.mockReturnValue(true);
    });

    it("should successfully update account with all fields", async () => {
      const input = {
        displayName: "New Display Name",
        phone: "+9876543210",
        timeZone: "Europe/London",
        dateOfBirth: "1990-01-01",
        image: "profile.jpg",
      };

      const result = await userResolvers.Mutation.updateProfile(
        null,
        { input },
        mockContext
      );

      expect(result).toEqual({ success: true });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: {
          displayName: "New Display Name",
          phone: "+9876543210",
          timeZone: "Europe/London",
          dateOfBirth: new Date("1990-01-01"),
          image: "profile.jpg",
          onboarded: true, // Set to true because displayName is provided and user not onboarded
        },
      });
    });

    it("should update only provided fields", async () => {
      const input = {
        displayName: "New Name",
      };

      await userResolvers.Mutation.updateProfile(null, { input }, mockContext);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: {
          displayName: "New Name",
          onboarded: true,
        },
      });
    });

    it("should not set onboarded to true if user is already onboarded", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockExistingUser,
        onboarded: true,
      });

      const input = { displayName: "New Name" };

      await userResolvers.Mutation.updateProfile(null, { input }, mockContext);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: {
          displayName: "New Name",
        },
      });
    });

    it("should not set onboarded to true if displayName is not provided", async () => {
      const input = { phone: "+1234567890" };

      await userResolvers.Mutation.updateProfile(null, { input }, mockContext);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: {
          phone: "+1234567890",
        },
      });
    });

    it("should throw UNAUTHENTICATED error when user is not authenticated", async () => {
      mockContext.user = null;

      await expect(
        userResolvers.Mutation.updateProfile(null, { input: {} }, mockContext)
      ).rejects.toThrow(
        new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        })
      );
    });

    it("should throw BAD_USER_INPUT error for invalid timezone", async () => {
      mockIsValidIANA.mockReturnValue(false);
      const input = { timeZone: "Invalid/Timezone" };

      await expect(
        userResolvers.Mutation.updateProfile(null, { input }, mockContext)
      ).rejects.toThrow(
        new GraphQLError("Invalid timeZone", {
          extensions: { code: "BAD_USER_INPUT" },
        })
      );

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it("should throw NOT_FOUND error when user does not exist", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        userResolvers.Mutation.updateProfile(null, { input: {} }, mockContext)
      ).rejects.toThrow(
        new GraphQLError("User not found", {
          extensions: { code: "NOT_FOUND" },
        })
      );
    });

    it("should handle Prisma unique constraint violation (P2002)", async () => {
      const prismaError = {
        code: "P2002",
        message: "Unique constraint failed",
        meta: { target: ["email"] },
      };
      mockPrisma.user.update.mockRejectedValue(prismaError);

      await expect(
        userResolvers.Mutation.updateProfile(null, { input: {} }, mockContext)
      ).rejects.toThrow(
        new GraphQLError("email already in use", {
          extensions: {
            code: "BAD_USER_INPUT",
            details: "Unique constraint failed",
            meta: { target: ["email"] },
          },
        })
      );
    });

    it("should handle P2002 error with missing target field", async () => {
      const prismaError = {
        code: "P2002",
        message: "Unique constraint failed",
        meta: {},
      };
      mockPrisma.user.update.mockRejectedValue(prismaError);

      await expect(
        userResolvers.Mutation.updateProfile(null, { input: {} }, mockContext)
      ).rejects.toThrow(
        new GraphQLError("field already in use", {
          extensions: {
            code: "BAD_USER_INPUT",
            details: "Unique constraint failed",
            meta: {},
          },
        })
      );
    });

    it("should handle generic database errors", async () => {
      const dbError = new Error("Database error");
      mockPrisma.user.update.mockRejectedValue(dbError);

      await expect(
        userResolvers.Mutation.updateProfile(null, { input: {} }, mockContext)
      ).rejects.toThrow(
        new GraphQLError("Database error", {
          extensions: {
            code: "INTERNAL_SERVER_ERROR",
            details: "Database error",
            stack: undefined, // NODE_ENV is not development
          },
        })
      );
    });

    it("should include stack trace in development mode", async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const dbError = new Error("Database error");
      dbError.stack = "Error stack trace";
      mockPrisma.user.update.mockRejectedValue(dbError);

      await expect(
        userResolvers.Mutation.updateProfile(null, { input: {} }, mockContext)
      ).rejects.toThrow(
        new GraphQLError("Database error", {
          extensions: {
            code: "INTERNAL_SERVER_ERROR",
            details: "Database error",
            stack: "Error stack trace",
          },
        })
      );

      process.env.NODE_ENV = originalNodeEnv;
    });

    it("should handle errors without message property", async () => {
      mockPrisma.user.update.mockRejectedValue({ code: "UNKNOWN" });

      await expect(
        userResolvers.Mutation.updateProfile(null, { input: {} }, mockContext)
      ).rejects.toThrow(
        new GraphQLError("Failed to update profile", {
          extensions: {
            code: "INTERNAL_SERVER_ERROR",
            details: undefined,
            stack: undefined,
          },
        })
      );
    });
  });

  describe("Mutation.logout", () => {
    it("should successfully logout with refresh token", async () => {
      const refreshToken = "refresh_token_value";
      const hashedToken = "hashed_token";

      mockReq.cookies.refresh_token = refreshToken;

      const mockHashInstance = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue(hashedToken),
      };
      mockCreateHash.mockReturnValue(mockHashInstance as any);

      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      const result = await userResolvers.Mutation.logout(null, {}, mockContext);

      expect(result).toEqual({ success: true });
      expect(mockCreateHash).toHaveBeenCalledWith("sha256");
      expect(mockHashInstance.update).toHaveBeenCalledWith(refreshToken);
      expect(mockHashInstance.digest).toHaveBeenCalledWith("hex");
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { tokenHash: hashedToken, userId: "user-123" },
      });
      expect(mockRes.clearCookie).toHaveBeenCalledTimes(2);
    });

    it("should successfully logout without refresh token", async () => {
      mockReq.cookies = {};

      const result = await userResolvers.Mutation.logout(null, {}, mockContext);

      expect(result).toEqual({ success: true });
      expect(mockPrisma.refreshToken.deleteMany).not.toHaveBeenCalled();
      expect(mockRes.clearCookie).toHaveBeenCalledTimes(2);
    });

    it("should return success when user is not authenticated", async () => {
      mockContext.user = null;

      const result = await userResolvers.Mutation.logout(null, {}, mockContext);

      expect(result).toEqual({ success: true });
      expect(mockPrisma.refreshToken.deleteMany).not.toHaveBeenCalled();
      expect(mockRes.clearCookie).not.toHaveBeenCalled();
    });

    it("should handle database errors and return success false", async () => {
      mockReq.cookies.refresh_token = "token";
      mockCreateHash.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue("hash"),
      } as any);
      mockPrisma.refreshToken.deleteMany.mockRejectedValue(
        new Error("DB Error")
      );

      const result = await userResolvers.Mutation.logout(null, {}, mockContext);

      expect(result).toEqual({ success: false });
    });

    it("should clear cookies even when database operation fails", async () => {
      mockReq.cookies.refresh_token = "token";
      const mockHashInstance = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue("hash"),
      };
      mockCreateHash.mockReturnValue(mockHashInstance as any);

      // Mock the database error
      mockPrisma.refreshToken.deleteMany.mockRejectedValue(
        new Error("DB Error")
      );

      // Mock console.error to prevent test output pollution
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const result = await userResolvers.Mutation.logout(null, {}, mockContext);

      // Verify the result and that clearCookie was called
      expect(result).toEqual({ success: false });
      expect(mockRes.clearCookie).toHaveBeenCalledWith("auth_token", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      });
      expect(mockRes.clearCookie).toHaveBeenCalledWith("refresh_token", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      });

      // Clean up
      consoleErrorSpy.mockRestore();
    });
  });
});
