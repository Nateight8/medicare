import * as nodemailer from "nodemailer";
import { EmailService } from "../types";

class NodemailerEmailService implements EmailService {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  async sendMagicLink(email: string, link: string): Promise<void> {
    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: email,
      subject: "Your Magic Login Link",
      html: `<p>Click the link below to log in:</p><a href="${link}">${link}</a>`,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendOTP(email: string, otp: string): Promise<void> {
    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: email,
      subject: "Your One-Time Password (OTP)",
      html: `<p>Your OTP code is: <strong>${otp}</strong></p>`,
    };

    await this.transporter.sendMail(mailOptions);
  }
}

export const emailService = new NodemailerEmailService();

export { NodemailerEmailService };
