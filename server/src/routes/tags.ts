import { Router } from "express";
import { getTags, createTag, deleteTag } from "../controllers";
import { authMiddleware } from "../middlewares";

const router = Router();

router.get("/", authMiddleware, getTags);
router.post("/", authMiddleware, createTag);
router.delete("/:id", authMiddleware, deleteTag);

export default router;
