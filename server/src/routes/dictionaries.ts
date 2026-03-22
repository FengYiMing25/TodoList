import { FastifyInstance } from "fastify";
import {
  getDictionaries,
  getDictionaryById,
  createDictionary,
  updateDictionary,
  deleteDictionary,
} from "../controllers/dictionaryController";
import { authMiddleware } from "../middlewares/auth";

export default async function dictionaryRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", authMiddleware);

  fastify.get("/", getDictionaries);
  fastify.get("/:id", getDictionaryById);
  fastify.post("/", createDictionary);
  fastify.put("/:id", updateDictionary);
  fastify.delete("/:id", deleteDictionary);
}
