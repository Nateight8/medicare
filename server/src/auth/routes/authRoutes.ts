// src/auth/routes/authRoutes.ts
import { Router } from "express";
import { authController } from "../controllers/authController";

const router = Router();

router.post("/magiclink", authController.sendMagicLink);
router.get("/magiclink/validate", authController.validateMagicLink);

export default router;
