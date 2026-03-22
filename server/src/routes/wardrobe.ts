import { FastifyInstance } from "fastify";
import {
  getWardrobeItems,
  getWardrobeItemById,
  createWardrobeItem,
  updateWardrobeItem,
  discardWardrobeItem,
  deleteWardrobeItem,
  getWardrobeStatistics,
} from "../controllers/wardrobeController";
import { authMiddleware } from "../middlewares/auth";

export default async function wardrobeRoutes(fastify: FastifyInstance) {
  fastify.get("/statistics", { preHandler: authMiddleware }, getWardrobeStatistics);
  fastify.get("/", { preHandler: authMiddleware }, getWardrobeItems);
  fastify.get("/:id", { preHandler: authMiddleware }, getWardrobeItemById);
  fastify.post("/", { preHandler: authMiddleware }, createWardrobeItem);
  fastify.put("/:id", { preHandler: authMiddleware }, updateWardrobeItem);
  fastify.post("/:id/discard", { preHandler: authMiddleware }, discardWardrobeItem);
  fastify.delete("/:id", { preHandler: authMiddleware }, deleteWardrobeItem);
}
