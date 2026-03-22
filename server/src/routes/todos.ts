import { FastifyInstance } from "fastify";
import {
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
  toggleTodoStatus,
} from "../controllers/todoController";
import { authMiddleware } from "../middlewares/auth";

export default async function todoRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: authMiddleware }, getTodos);
  fastify.get("/:id", { preHandler: authMiddleware }, getTodoById);
  fastify.post("/", { preHandler: authMiddleware }, createTodo);
  fastify.put("/:id", { preHandler: authMiddleware }, updateTodo);
  fastify.delete("/:id", { preHandler: authMiddleware }, deleteTodo);
  fastify.patch("/:id/toggle", { preHandler: authMiddleware }, toggleTodoStatus);
}
