// tests/auth/services/emailService.test.ts

// Mock nodemailer before any imports

// Define the type for nodemailer sendMail return
type SentMessageInfo = {
  messageId: string;
  accepted?: string[];
  rejected?: string[];
  response?: string;
};

// A Jest mock: takes 1 arg (mail options), returns a Promise<SentMessageInfo>
const sendMailMock = jest.fn<(mail: any) => Promise<SentMessageInfo>>();

jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({
    sendMail: sendMailMock,
  })),
}));

import { NodemailerEmailService } from "../../../auth/services/emailService";
import { describe, beforeEach, it, expect, jest } from "@jest/globals";

describe("NodemailerEmailService", () => {
  let emailService: NodemailerEmailService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up default mock implementation
    sendMailMock.mockResolvedValue({
      messageId: "test-message-id",
    } as SentMessageInfo);
    emailService = new NodemailerEmailService();
  });

  describe("sendMagicLink", () => {
    it("should send magic link email with correct content", async () => {
      const email = "user@example.com";
      const link = "https://app.example.com/auth/verify?token=abc123";

      await emailService.sendMagicLink(email, link);

      expect(sendMailMock).toHaveBeenCalledWith({
        from: process.env.SMTP_FROM_EMAIL,
        to: email,
        subject: "Your Magic Login Link",
        html: `<p>Click the link below to log in:</p><a href="${link}">${link}</a>`,
      });
    });

    it("should propagate sendMail errors", async () => {
      sendMailMock.mockRejectedValueOnce(new Error("SMTP Error"));

      await expect(
        emailService.sendMagicLink("fail@example.com", "http://link")
      ).rejects.toThrow("SMTP Error");
    });
  });

  describe("sendOTP", () => {
    it("should send OTP email with correct content", async () => {
      const email = "user@example.com";
      const otp = "123456";

      await emailService.sendOTP(email, otp);

      expect(sendMailMock).toHaveBeenCalledWith({
        from: process.env.SMTP_FROM_EMAIL,
        to: email,
        subject: "Your One-Time Password (OTP)",
        html: `<p>Your OTP code is: <strong>${otp}</strong></p>`,
      });
    });

    it("should propagate sendMail errors", async () => {
      sendMailMock.mockRejectedValueOnce(new Error("Network Error"));

      await expect(
        emailService.sendOTP("fail@example.com", "123456")
      ).rejects.toThrow("Network Error");
    });
  });
});
