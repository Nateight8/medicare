import { redisUtil } from "../../lib/redis";
interface OTPOptions {
  ttl?: number; // seconds
  length?: number;
}

export class OTPService {
  static generateOTP(length = 6): string {
    const digits = "0123456789";
    let otp = "";
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }

  static async sendOTP(
    email: string,
    options: OTPOptions = {}
  ): Promise<string> {
    const { ttl = 300, length = 6 } = options;
    const otp = this.generateOTP(length);
    const key = this.getRedisKey(email);

    await redisUtil.set(key, otp, ttl);
    return otp;
  }

  static async verifyOTP(email: string, input: string): Promise<boolean> {
    const key = this.getRedisKey(email);
    const stored = await redisUtil.get(key);
    return stored === input;
  }

  static async clearOTP(email: string): Promise<void> {
    const key = this.getRedisKey(email);
    await redisUtil.del(key);
  }

  private static getRedisKey(email: string): string {
    return `otp:${email}`;
  }
}
