// services/refreshTokenService.ts
import crypto from "crypto";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export class RefreshTokenService {
  async create(userId: string, daysValid = 7) {
    const token = crypto.randomBytes(40).toString("hex");
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  async validate(token: string, userId: string) {
    const tokens = await prisma.refreshToken.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
    });

    for (const stored of tokens) {
      if (await bcrypt.compare(token, stored.tokenHash)) {
        return true;
      }
    }
    return false;
  }

  async revoke(token: string, userId: string) {
    const tokens = await prisma.refreshToken.findMany({
      where: { userId },
    });

    for (const stored of tokens) {
      if (await bcrypt.compare(token, stored.tokenHash)) {
        await prisma.refreshToken.delete({ where: { id: stored.id } });
      }
    }
  }
}
