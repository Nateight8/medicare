# Magic Link Authentication: Building a Cross-Device Authentication System (Part 2)

_This is Part 2 of my magic link authentication series. In [Part 1](link-to-part-1), I shared why I moved away from traditional password authentication and OAuth-only solutions. Now let's dive into the actual implementation._

## From Concept to Code: Building the Magic Link System

After deciding on magic links for my prescription management app, I faced the reality of implementation. The concept seemed straightforward, but as any developer knows, the devil is in the details.

Let me walk you through how I built a production-ready magic link authentication system that elegantly handles the cross-device challenge I mentioned in Part 1.

## Architecture Decisions: Why REST in a GraphQL World

Before we dive into code, I need to address something that might seem contradictory: I chose REST endpoints for authentication in what is otherwise a GraphQL-first application.

The reason is simple: magic links in emails need to be straightforward GET requests that work reliably across all email clients. While you _could_ make GraphQL work with email links, REST endpoints are the natural fit for this use case.

## The Core Flow: Elegant Simplicity

The magic link concept is beautifully simple when you break it down:

1. **Request**: User provides their email address
2. **Generate**: Server creates a secure token and sends it via email
3. **Verify**: User clicks the link, proving they own the email
4. **Authenticate**: Server validates the token and logs them in

But as I learned building this system, the real complexity comes from handling edge cases and creating a smooth user experience. Let me show you how I implemented each piece.

## The Entry Point: Requesting a Magic Link

Everything starts with a simple endpoint that receives an email and triggers the authentication flow:

```javascript
// Route definition
router.post("/magiclink", authController.sendMagicLink);
```

The controller implementation is refreshingly straightforward:

```typescript
async sendMagicLink(req: Request, res: Response) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  await magicLinkService.requestMagicLink(email);
  return res.status(200).json({ message: "Magic link sent!", success: true });
}
```

This simplicity is intentional. The endpoint does one thing well: it takes an email, delegates the token generation and email sending to a service, and returns a success response. No complex validation, no user lookup at this stage—just pure delegation.

The `MagicLinkService` handles the token generation and email logic:

## Email Delivery: The Critical Link

I understand that for my magic link system to work, I need reliable email delivery. You can have the most elegant token generation in the world, but if emails don't reach users' inboxes, the whole system falls apart.

I chose Nodemailer for email delivery, primarily because it gives me control over the SMTP configuration and doesn't tie me to a specific email service provider:

```typescript
// src/auth/services/emailService.ts
import * as nodemailer from "nodemailer";
import { EmailService } from "../types";

class NodemailerEmailService implements EmailService {
  private transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  async sendMagicLink(email: string, link: string): Promise<void> {
    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL,
      to: email,
      subject: "Your Magic Login Link",
      html: `<p>Click the link below to log in:</p><a href="${link}">${link}</a>`,
    };

    await this.transporter.sendMail(mailOptions);
  }
}

export const emailService = new NodemailerEmailService();
```

## Why SMTP Over Email APIs?

You might wonder why I chose SMTP over services like SendGrid, AWS SES, or Mailgun APIs. Here's my reasoning:

**Provider Flexibility**: With SMTP configuration, I can switch email providers without changing code. Today it might be Gmail's SMTP, tomorrow it could be AWS SES or a dedicated email service.

**Cost Control**: For a prescription management app that might send a handful of emails per user per month, SMTP through existing providers can be more cost-effective than API-based services with per-email pricing.

**Simplicity**: Nodemailer's SMTP approach is straightforward—it's just email sending without learning another API or managing API keys beyond basic SMTP credentials.

The configuration is entirely environment-driven, which means I can easily adapt to different email providers across development, staging, and production environments.

## The Email Template:I Kept It Simple

Notice the minimal HTML template in the `sendMagicLink` method. This simplicity is intentional:

- **No complex styling** that might break across email clients
- **Clear call-to-action** with the magic link prominently displayed
- **Accessible text** that works even if HTML rendering fails

In production, you'd probably want more sophisticated templates, but for the core functionality, simple works reliably across all email clients.

## Behind the Scenes: The Magic Link Service

```typescript
async requestMagicLink(email: string): Promise<void> {
  console.log(`[MagicLinkService] Requesting magic link for: ${email}`); //<== DEBUG

  try {
    const payload: TokenPayload = {
      email,
      type: "magiclink",
    };

    const token = await this.tokenService.generateToken(payload, {
      expiresIn: this.config.tokenExpiry,
    });

    const link = `${this.config.magicLinkBaseUrl}?token=${token}`;

    // Store in Redis for additional security
    const redisKey = this.getRedisKey(token);
    const ttl = 15 * 60; // 15 minutes
    const stored = await redisUtil.set(redisKey, email, ttl);
    if (!stored) throw new Error("Failed to store token in Redis");

    // Send the magic link email
    await emailService.sendMagicLink(email, link);
  } catch (error) {
    console.error("[MagicLinkService] Error in requestMagicLink:", error);
    throw error;
  }
}
```

Here's what makes this approach secure and reliable:

**JWT Token Generation**: Each token contains the email and a type identifier, signed with our secret key and set to expire in 15 minutes.

**Redis Double-Check**: Beyond JWT expiration, I store each token in Redis with its own TTL
(time to live). This gives us an additional layer of control—we can invalidate tokens immediately if needed.

**Email as Proof of Ownership**: The fundamental security assumption is simple but powerful: if you can access the email, you own that account.

## The Validation Endpoint

When a user clicks the magic link in their email, they hit our validation endpoint directly. The magic link URL is the server endpoint itself—there's no separate validation page. The validation happens on the server, and users get redirected automatically based on the result.

This direct endpoint approach improves user experience by eliminating unnecessary page loads—users go straight from email click to their authenticated destination without intermediate validation screens.

```javascript
router.get("/magiclink/validate", authController.validateMagicLink);
```

This is where the cross-device intelligence I mentioned in Part 1 comes into play:

```typescript
async validateMagicLink(req: Request, res: Response) {
  const { token } = req.query;
  if (typeof token !== "string") {
    return res.status(400).json({ error: "Invalid token" });
  }

  const payload = await magicLinkService.validateToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  // Ensure user exists in database
  let user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: { email: payload.email },
    });
  }

  // Here's where the cross-device magic happens
  const ua = req.headers["user-agent"] || "";
  const agent = parse(ua);
  const isMobile = agent.device?.toString().toLowerCase().includes("mobile");

  if (isMobile) {
    // Direct mobile authentication - send to app
    return res.redirect(
      `yourapp://auth/verify?token=${encodeURIComponent(token)}`
    );
  }

  // Desktop detected - initiate QR code flow
  const requestId = await magicLinkService.storeAuthRequest(user.id);
  return res.redirect(
    `${process.env.WEB_APP_URL}/auth/qr?requestId=${encodeURIComponent(requestId)}`
  );
}
```

This validation logic solves the cross-device problem I mentioned in Part 1. The server becomes intelligent about the user's context:

**Mobile Device Detected**: If the user clicks the magic link on their phone, they get redirected directly to the mobile app via a deep link. Simple and seamless.

**Desktop Browser Detected**: If they're on a computer, the system assumes they want to authenticate their mobile device. It generates a `requestId`, stores the user's information temporarily, and redirects to a QR code page.

**User Creation on Demand**: Notice how we create the user account only when they successfully validate their email ownership. No abandoned accounts from unverified emails.

## The QR Code Bridge: Connecting Devices

When the system detects a desktop browser, it redirects to a QR code page. The QR code generation itself is refreshingly simple—sometimes the most elegant solutions don't need complex architectures.

I kept the QR code logic directly in the controller because there wasn't enough complexity to justify a separate service:

```typescript
// src/auth/controllers/qrController.ts
import { Request, Response } from "express";
import QRCode from "qrcode";

export const qrController = {
  async generateQRCode(req: Request, res: Response) {
    const { requestId } = req.query;
    if (typeof requestId !== "string") {
      return res.status(400).json({ error: "Missing or invalid requestId" });
    }

    // The URL encoded inside the QR code that the mobile app will scan
    const qrData = `${process.env.BACKEND_URL}/auth/qr-scan?requestId=${requestId}`;

    try {
      const qrPngBuffer = await QRCode.toBuffer(qrData, {
        type: "png",
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });

      res.setHeader("Content-Type", "image/png");
      return res.send(qrPngBuffer);
    } catch (error) {
      console.error("Error generating QR code:", error);
      return res.status(500).json({ error: "Failed to generate QR code" });
    }
  },
};
```

## Why Keep It Simple?

This controller does exactly one thing: it takes a `requestId` and generates a PNG image of a QR code. The logic is straightforward:

1. **Extract the requestId** from the query parameters
2. **Build the scan URL** that the mobile app will handle
3. **Generate the QR code** as a PNG buffer using the `qrcode` package
4. **Return the image** directly as a PNG response

The `qrcode` package handles all the heavy lifting. I chose specific settings for good mobile scanning:

- **300px width**: Large enough to scan easily, small enough to load quickly
- **2px margin**: Clean white space around the code
- **High contrast colors**: Black on white for maximum readability

## Why `requestId` is Critical: The Cross-Device Handshake

The `requestId` might seem like just another parameter, but it's actually the heart of the entire cross-device authentication system. Without it, the server would have no way to know which user to authenticate when a mobile device scans the QR code.

Here's the problem it solves:

**Without `requestId`:**

- User clicks magic link on desktop → server validates token, knows it's user123
- Desktop shows QR code (but the QR code has no idea which user this is for)
- Mobile app scans QR code → hits server
- **Server has NO IDEA which user the mobile app should authenticate as**

**With `requestId` (the handshake):**

- User clicks magic link on desktop → server validates token, knows it's user123
- Server generates `requestId` (like "abc123") and stores in Redis: `"abc123" → "user123"`
- QR code contains the `requestId`: `/auth/qr-scan?requestId=abc123`
- Mobile app scans → sends `requestId=abc123` to server
- Server looks up: `"abc123"` → finds `"user123"`
- **Now server knows to authenticate user123 on the mobile device**

The `requestId` is essentially the "handshake token" that bridges two completely separate contexts—the desktop browser session and the mobile app—allowing secure user identification across devices.

## The Cross-Device Flow in Action

Here's how the complete cross-device authentication works:

1. User requests magic link on mobile app
2. User clicks magic link on their desktop computer
3. System detects desktop browser, creates `requestId`, stores user info in Redis
4. Desktop browser redirects to `/auth/qr?requestId=...`
5. Frontend calls our QR endpoint to get the QR code image
6. QR code contains: `${BACKEND_URL}/auth/qr-scan?requestId=${requestId}`
7. User has two options:
   - **Mobile Authentication**: Scan QR code with mobile app, which calls `/auth/continue`
   - **Desktop Authentication**: Click "Continue on this device" button to authenticate on PC

## The Final Piece: `/auth/continue` Endpoint

The mobile app scans the QR code, extracts the `requestId`, and calls the `/auth/continue` endpoint to complete the authentication flow:

```typescript
async continueOnDevice(req: Request, res: Response) {
  const { requestId } = req.body;
  if (!requestId || typeof requestId !== "string") {
    return res.status(400).json({ error: "Missing or invalid requestId" });
  }

  try {
    // Retrieve stored session from Redis
    const sessionKey = `auth:qr:${requestId}`;
    const userId = await redisUtil.get(sessionKey);

    if (!userId) {
      return res.status(400).json({ error: "Invalid or expired session" });
    }

    // Get user from DB
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Access token payload
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      type: "magiclink",
    };

    // 1️⃣ Issue short-lived access token
    const accessToken = await (magicLinkService as any)[
      "tokenService"
    ].generateToken(payload, { expiresIn: process.env.JWT_EXPIRY || "1h" });

    // 2️⃣ Generate and store long-lived refresh token
    const refreshTokenValue = crypto.randomBytes(32).toString("hex");
    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshTokenValue)
      .digest("hex");

    await prisma.refreshToken.create({
      data: {
        tokenHash: refreshTokenHash,
        userId: user.id,
        expiresAt: addDays(new Date(), 30), // 30 days validity
      },
    });

    // 3️⃣ Store both tokens in HTTP-only cookies
    res.cookie("auth_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600 * 1000, // 1h
    });

    res.cookie("refresh_token", refreshTokenValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // 4️⃣ Clean up Redis
    await redisUtil.del(sessionKey);

    // ✅ Send user data in response
    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        timeZone: user.timeZone,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        onboarded: user.onboarded,
      },
    });
  } catch (err) {
    console.error("ContinueOnDevice error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
```

This endpoint is where all the cross-device magic comes together. Let me break down what makes this implementation robust:

## The Authentication Completion Process

**1. Request Validation**: The endpoint expects a `requestId` in the request body—this comes from either the QR code scan or the desktop "continue on this device" action.

**2. Session Retrieval**: Using the `requestId`, we retrieve the stored `userId` from Redis. Remember, this was stored with a short TTL (120 seconds) when the user first clicked the magic link.

**3. User Verification**: We fetch the complete user record from the database to ensure the user still exists and get their current information.

**4. Dual Token Strategy**: Here's where the security gets interesting. Instead of just issuing one token, I implement a dual-token approach:

- **Access Token**: Short-lived (1 hour) JWT for API requests
- **Refresh Token**: Long-lived (30 days) cryptographically secure random token

**5. Secure Cookie Storage**: Both tokens get stored in HTTP-only cookies, making them inaccessible to client-side JavaScript and protecting against XSS attacks.

**6. Session Cleanup**: The `requestId` gets deleted from Redis immediately after use, ensuring each QR code or magic link can only be used once.

## Why the Dual Token Approach?

This authentication strategy balances security with user experience:

**Short Access Tokens** mean that if a token is compromised, the exposure window is limited to just one hour.

**Long Refresh Tokens** allow users to stay logged in for weeks without re-authentication, but they're stored securely and can be revoked if needed.

**HTTP-Only Cookies** protect both tokens from client-side attacks while still allowing automatic inclusion in requests.

The refresh token gets hashed before storage—even if someone gains database access, they can't use the stored hash to authenticate.

# Service Architecture: Why Classes Over Functions

Before we wrap up, I want to address an architectural choice that might seem old-fashioned in the modern JavaScript ecosystem: using classes for services instead of simple functions or modules.

I could have structured the authentication services as collections of functions:

```typescript
// The typical functional approach
export const sendMagicLink = async (email: string) => {
  /* ... */
};
export const validateToken = async (token: string) => {
  /* ... */
};
```

But I chose a class-based approach for my services:

```typescript
const magicLinkService = new MagicLinkServiceImpl({
  magicLinkBaseUrl:
    process.env.BACKEND_URL ||
    "http://localhost:4000/api/auth/magiclink/validate",
  jwtSecret: process.env.JWT_SECRET || "your-secret-key",
  tokenExpiry: "1h",
  redisPrefix: "auth:",
});
```

Let me show you exactly why this matters with a concrete comparison.

## The Functional Approach: What I Could Have Done

Here's how the functional approach typically looks for magic link authentication:

```typescript
// services/magicLinkService.ts (Functional)
import { emailService } from "./emailService";
import { generateToken, verifyToken } from "./tokenService";
import { redisUtil } from "../utils/redis";

export const sendMagicLink = async (email: string): Promise<void> => {
  try {
    const payload = { email, type: "magiclink" };

    // Configuration scattered across function calls
    const token = await generateToken(payload, {
      expiresIn: process.env.TOKEN_EXPIRY || "15m",
      secret: process.env.JWT_SECRET,
    });

    const baseUrl = process.env.BACKEND_URL || "http://localhost:4000";
    const link = `${baseUrl}/api/auth/magiclink/validate?token=${token}`;

    // Redis configuration repeated
    const redisKey = `auth:magiclink:${token}`;
    const ttl = 15 * 60;
    await redisUtil.set(redisKey, email, ttl);
    await emailService.sendMagicLink(email, link);
  } catch (error) {
    throw error;
  }
};

export const validateToken = async (
  token: string
): Promise<TokenPayload | null> => {
  try {
    // Configuration repeated again
    const payload = await verifyToken(token, process.env.JWT_SECRET);
    const redisKey = `auth:magiclink:${token}`;
    const storedEmail = await redisUtil.get(redisKey);

    if (!storedEmail || storedEmail !== payload.email) return null;

    await redisUtil.del(redisKey);
    return payload;
  } catch (error) {
    return null;
  }
};
```

## The Class-Based Approach: What I Actually Built

Now here's the same functionality using the class-based architecture:

```typescript
// interfaces/MagicLinkService.ts
interface MagicLinkConfig {
  magicLinkBaseUrl: string;
  jwtSecret: string;
  tokenExpiry: string;
  redisPrefix: string;
}

// services/MagicLinkServiceImpl.ts
class MagicLinkServiceImpl implements MagicLinkService {
  private tokenService: TokenService;
  private config: MagicLinkConfig;

  constructor(config: MagicLinkConfig) {
    this.config = config;
    // Dependency injection - tokenService configured once
    this.tokenService = new JWTTokenService(config.jwtSecret);
  }

  async requestMagicLink(email: string): Promise<void> {
    try {
      const payload = { email, type: "magiclink" };

      // Configuration accessed from instance state
      const token = await this.tokenService.generateToken(payload, {
        expiresIn: this.config.tokenExpiry,
      });

      const link = `${this.config.magicLinkBaseUrl}?token=${token}`;

      // Consistent Redis key generation
      const redisKey = this.getRedisKey(token);
      const ttl = 15 * 60;
      await redisUtil.set(redisKey, email, ttl);
      await emailService.sendMagicLink(email, link);
    } catch (error) {
      throw error;
    }
  }

  async validateToken(token: string): Promise<TokenPayload | null> => {
    try {
      // No need to pass secret - tokenService already configured
      const payload = await this.tokenService.verifyToken(token);
      const redisKey = this.getRedisKey(token);
      const storedEmail = await redisUtil.get(redisKey);

      if (!storedEmail || storedEmail !== payload.email) return null;

      await redisUtil.del(redisKey);
      return payload;
    } catch (error) {
      return null;
    }
  }

  // Private helper method for consistent key generation
  private getRedisKey(token: string): string {
    return `${this.config.redisPrefix}magiclink:${token}`;
  }
}
```

## Why Classes Make Sense for Authentication Services

The differences might seem subtle, but they have real impact on maintainability and reliability:

### 1. Configuration Management

**Functional Problem:**

```typescript
// JWT secret scattered across multiple functions
const token = await generateToken(payload, {
  secret: process.env.JWT_SECRET, // Repeated everywhere
});
```

**Class Solution:**

```typescript
// Configuration centralized and injected once
constructor(config: MagicLinkConfig) {
  this.tokenService = new JWTTokenService(config.jwtSecret);
}
```

### 2. Consistency Guarantees

**Functional Risk:**

```typescript
// Redis keys might be inconsistent
const redisKey = `auth:magiclink:${token}`; // sendMagicLink
const sessionKey = `auth:qr:${requestId}`; // different function
```

**Class Protection:**

```typescript
// Single method ensures consistency
private getRedisKey(token: string): string {
  return `${this.config.redisPrefix}magiclink:${token}`;
}
```

### 3. Testing Simplicity

The class approach makes testing dramatically cleaner:

```typescript
// Class-based testing
describe("Magic Link Service", () => {
  let service: MagicLinkService;

  beforeEach(() => {
    // Clean dependency injection
    service = new MagicLinkServiceImpl({
      magicLinkBaseUrl: "http://test.com/auth",
      jwtSecret: "test-secret",
      tokenExpiry: "15m",
      redisPrefix: "test:",
    });
  });

  it("should generate consistent redis keys", () => {
    // Each test gets isolated service instance
    // No global mocking needed
  });
});
```

Compare this to the functional approach, where you'd need to mock `process.env` variables and deal with global function mocking that can affect other tests.

## When Functions Still Make Sense

I'm not advocating for classes everywhere. For pure utility functions or stateless operations, functions are perfect:

```typescript
// Perfect as functions
export const hashPassword = (password: string) => bcrypt.hash(password, 10);
export const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
```

But for services that:

- Manage configuration state
- Have multiple related operations
- Need dependency injection
- Require consistent behavior across methods

Classes provide cleaner architecture without the overhead.

## The Production Impact

For my prescription management app, this architectural choice has paid dividends:

- **Environment Switching**: Different Redis prefixes and base URLs for dev/staging/production
- **Security Updates**: When I needed to rotate JWT secrets, I changed one configuration point
- **Feature Additions**: Adding token refresh and session management naturally extended the existing service
- **Bug Prevention**: Consistent Redis key generation eliminated a whole class of "token not found" bugs

This isn't about being old-school or new-school—it's about choosing the right tool for the job. Authentication services have enough complexity and state to benefit from the structure that classes provide.

## Wrapping Up: A Complete Authentication Solution

We've covered the core implementation of a production-ready magic link authentication system that elegantly handles cross-device scenarios. From token generation and email delivery to QR codes and session management, this approach provides a seamless user experience while maintaining strong security principles.

While this article covers the essential components, a complete authentication system involves additional considerations like error handling, rate limiting, token refresh mechanisms, and comprehensive logging. The architecture we've built provides a solid foundation that can be extended as your application's needs grow.

## See the Full Implementation

The complete codebase for this magic link authentication system is available on GitHub. You'll find additional utilities, error handling, and configuration details that weren't covered in this article.

**🔗 [View the complete project on GitHub](your-github-link-here)**

If you found this implementation helpful, I'd appreciate:

- ⭐ A star on the repository
- 👥 Contributions and improvements via pull requests
- 💬 Your thoughts and questions in the issues section

Building authentication systems taught me that the real challenge isn't just making them work—it's making them work reliably across different devices, email clients, and user scenarios. I hope this approach helps you create authentication experiences that your users will actually enjoy.
