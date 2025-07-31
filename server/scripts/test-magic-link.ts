import { config } from "../src/config";
import { MagicLinkServiceImpl } from "../src/auth/services/magicLinkService";

// Create a test email service that logs to console
const testEmailService = {
  sendMagicLink: (email: string, link: string) => {
    console.log("\n--- Magic Link Email ---");
    console.log(`To: ${email}`);
    console.log(`Magic Link: ${link}`);
    console.log("------------------------\n");
    return Promise.resolve();
  },
  sendOTP: () => Promise.resolve(),
};

// Override the email service for testing
// @ts-ignore
import { emailService } from "../src/auth/services/emailService";
Object.assign(emailService, testEmailService);

// Test the magic link flow
async function testMagicLink() {
  console.log("Testing Magic Link Flow...");

  // Create a test magic link service with Redis debugging
  const magicLinkConfig = {
    magicLinkBaseUrl: "http://localhost:4000/api/auth/magiclink/validate",
    jwtSecret: config.jwt.secret,
    tokenExpiry: "15m",
    redisPrefix: "auth:", // Changed to match auth controller
  };
  
  console.log('Using Redis config:', {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    prefix: magicLinkConfig.redisPrefix
  });
  
  const magicLinkService = new MagicLinkServiceImpl(magicLinkConfig);

  // Test email
  const testEmail = "mbaocha240793@gmail.com";

  try {
    // 1. Request a magic link
    console.log("1. Requesting magic link...");
    await magicLinkService.requestMagicLink(testEmail);

    // The email service will log the magic link to the console
    // In a real test, you would extract the token from the URL

    console.log("✅ Magic link requested successfully!");
    console.log("Check the logs above for the magic link.");
  } catch (error) {
    console.error("❌ Error testing magic link:", error);
  }
}

// Run the test
testMagicLink().catch(console.error);
