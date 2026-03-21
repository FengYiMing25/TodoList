import { Router } from "express";
import { getTodos, getTodoById, createTodo, updateTodo, deleteTodo } from "../controllers";
import { authMiddleware } from "../middlewares";

const router = Router();

router.get("/", authMiddleware, getTodos);
router.get("/:id", authMiddleware, getTodoById);
router.post("/", authMiddleware, createTodo);
router.put("/:id", authMiddleware, updateTodo);
router.delete("/:id", authMiddleware, deleteTodo);

export default router;
