import { Router } from "express";
import { authController } from "../controllers/authController";
import { qrController } from "../controllers/qrcodeControler";

const router = Router();

// Magic Link endpoints
router.post("/auth/magiclink", authController.sendMagicLink);
router.get("/auth/magiclink/validate", authController.validateMagicLink);
router.post("/auth/magiclink/revoke", authController.revokeAuth);

// QR Code and Device Flow
router.get("/auth/qr", qrController.generateQRCode);
router.post("/auth/continue", authController.continueOnDevice);
router.post("/auth/poll", authController.pollAuthStatus);

// Token Management
router.post("/auth/refresh-token", authController.refreshToken);

export default router;
