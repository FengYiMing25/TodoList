import { Router } from "express";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../controllers";
import { authMiddleware } from "../middlewares";

const router = Router();

router.get("/", authMiddleware, getCategories);
router.post("/", authMiddleware, createCategory);
router.put("/:id", authMiddleware, updateCategory);
router.delete("/:id", authMiddleware, deleteCategory);

export default router;
