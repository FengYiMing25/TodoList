import { FastifyInstance } from "fastify";
import { getTags, createTag, deleteTag } from "../controllers/tagController";
import { authMiddleware } from "../middlewares/auth";

export default async function tagRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: authMiddleware }, getTags);
  fastify.post("/", { preHandler: authMiddleware }, createTag);
  fastify.delete("/:id", { preHandler: authMiddleware }, deleteTag);
}
