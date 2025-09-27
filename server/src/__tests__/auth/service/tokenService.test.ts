import { JWTTokenService } from "@/auth/services/tokenService";
import { AuthConfig, TokenPayload } from "../../../auth/types";

describe("JWTTokenService", () => {
  const config: AuthConfig = {
    jwtSecret: "supersecret",
    tokenExpiry: "1h", // default expiry
    magicLinkBaseUrl: "http://localhost:4000",
    redisPrefix: "auth:",
  };

  let tokenService: JWTTokenService;

  beforeEach(() => {
    tokenService = new JWTTokenService(config);
  });

  it("should generate a token with payload and default expiry", async () => {
    const payload: TokenPayload = {
      userId: "123",
      email: "test@example.com",
      type: "magiclink",
    };
    const token = await tokenService.generateToken(payload);

    expect(typeof token).toBe("string");

    const decoded = await tokenService.verifyToken(token);
    expect(decoded?.userId).toBe("123");
    expect(decoded?.iat).toBeDefined();
    expect(decoded?.exp).toBeDefined();
  });

  it("should generate a token with custom expiry in seconds", async () => {
    const payload: TokenPayload = {
      userId: "456",
      email: "test@example.com",
      type: "magiclink",
    };
    const token = await tokenService.generateToken(payload, { expiresIn: 10 });

    const decoded = await tokenService.verifyToken(token);
    const now = Math.floor(Date.now() / 1000);
    expect(decoded?.exp).toBeGreaterThanOrEqual(now);
    expect(decoded?.exp).toBeLessThanOrEqual(now + 10);
  });

  it("should generate a token with custom expiry in minutes (e.g., '2m')", async () => {
    const payload: TokenPayload = {
      userId: "789",
      email: "test@example.com",
      type: "magiclink",
    };
    const token = await tokenService.generateToken(payload, {
      expiresIn: "2m",
    });

    const decoded = await tokenService.verifyToken(token);
    const now = Math.floor(Date.now() / 1000);
    expect(decoded?.exp).toBeGreaterThanOrEqual(now);
    expect(decoded?.exp).toBeLessThanOrEqual(now + 120);
  });

  it("should generate a token with custom expiry in hours (e.g., '1h')", async () => {
    const payload: TokenPayload = {
      userId: "abc",
      email: "test@example.com",
      type: "magiclink",
    };
    const token = await tokenService.generateToken(payload, {
      expiresIn: "1h",
    });

    const decoded = await tokenService.verifyToken(token);
    const now = Math.floor(Date.now() / 1000);
    expect(decoded?.exp).toBeGreaterThanOrEqual(now);
    expect(decoded?.exp).toBeLessThanOrEqual(now + 3600);
  });

  it("should throw 'expired' error for expired token", async () => {
    const payload: TokenPayload = {
      userId: "expired",
      email: "test@example.com",
      type: "magiclink",
    };
    const token = await tokenService.generateToken(payload, {
      expiresIn: "1s",
    });

    // Wait for token to expire
    await new Promise((r) => setTimeout(r, 1100));

    await expect(tokenService.verifyToken(token)).rejects.toThrow("expired");
  });

  it("should throw 'invalid' error for tampered token", async () => {
    const payload: TokenPayload = {
      userId: "tampered",
      email: "test@example.com",
      type: "magiclink",
    };
    const token = await tokenService.generateToken(payload);

    const tamperedToken = token + "abc"; // corrupt token
    await expect(tokenService.verifyToken(tamperedToken)).rejects.toThrow(
      "invalid"
    );
  });

  it("should throw 'invalid' error for completely random string", async () => {
    await expect(tokenService.verifyToken("randomString")).rejects.toThrow(
      "invalid"
    );
  });
});
