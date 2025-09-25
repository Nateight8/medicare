// src/auth/controllers/authController.ts

import { Request, Response } from "express";
import QRCode from "qrcode";

export const qrController = {
  async generateQRCode(req: Request, res: Response) {
    const { requestId } = req.query;

    if (!requestId || typeof requestId !== "string") {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid requestId",
      });
    }

    try {
      // The URL that will be encoded in the QR code
      const authUrl = new URL(`/api/continue`, "http://localhost:4000");
      authUrl.searchParams.append("requestId", requestId);

      // Generate QR code as data URL
      const qrCodeUrl = await QRCode.toDataURL(authUrl.toString(), {
        width: 300,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });

      // Return the QR code as a data URL in the response
      return res.json({
        success: true,
        qrCodeUrl,
        requestId,
      });
    } catch (error) {
      console.error("Error generating QR code:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to generate QR code",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
};
