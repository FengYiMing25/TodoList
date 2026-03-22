import { FastifyInstance } from "fastify";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController";
import { authMiddleware } from "../middlewares/auth";

export default async function categoryRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: authMiddleware }, getCategories);
  fastify.post("/", { preHandler: authMiddleware }, createCategory);
  fastify.put("/:id", { preHandler: authMiddleware }, updateCategory);
  fastify.delete("/:id", { preHandler: authMiddleware }, deleteCategory);
}
