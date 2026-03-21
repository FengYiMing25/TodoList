import { Router } from "express";
import { register, login, getProfile, updateProfile } from "../controllers";
import { authMiddleware } from "../middlewares";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);

export default router;
