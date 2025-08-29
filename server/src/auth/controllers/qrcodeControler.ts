// src/auth/controllers/authController.ts

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
