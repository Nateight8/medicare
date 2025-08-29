import { Router } from "express";
import { authController } from "../controllers/authController";
import { qrController } from "../controllers/qrcodeControler";

const router = Router();

router.post("/magiclink", authController.sendMagicLink);
router.get("/magiclink/validate", authController.validateMagicLink);
router.get("/auth/qr", qrController.generateQRCode);
router.post("/auth/continue", authController.continueOnDevice);
router.post("/refresh-token", authController.refreshToken);

export default router;
