import { FastifyInstance } from "fastify";
import {
  getDictionaryTypes,
  createDictionaryType,
  updateDictionaryType,
  deleteDictionaryType,
} from "../controllers/dictionaryTypeController";
import { authMiddleware } from "../middlewares/auth";

export default async function dictionaryTypeRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", authMiddleware);

  fastify.get("/", getDictionaryTypes);
  fastify.post("/", createDictionaryType);
  fastify.put("/:key", updateDictionaryType);
  fastify.delete("/:key", deleteDictionaryType);
}
