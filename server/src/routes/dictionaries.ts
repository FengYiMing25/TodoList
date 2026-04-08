import { FastifyInstance } from "fastify";
import {
  getDictionaries,
  getDictionaryById,
  createDictionary,
  updateDictionary,
  deleteDictionary,
  initDefaultDictionaries,
  getDictionaryTypes,
} from "../controllers/dictionaryController";
import { authMiddleware } from "../middlewares/auth";
import type {
  CreateDictionaryRequest,
  DictionaryType,
  UpdateDictionaryRequest,
} from "@shared/types";

export default async function dictionaryRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", authMiddleware);

  fastify.get("/types", getDictionaryTypes);
  fastify.post<{ Body: { type?: DictionaryType } }>("/init-default", initDefaultDictionaries);
  fastify.get<{ Querystring: { type?: DictionaryType } }>("/", getDictionaries);
  fastify.get<{ Params: { id: string } }>("/:id", getDictionaryById);
  fastify.post<{ Body: CreateDictionaryRequest }>("/", createDictionary);
  fastify.put<{ Params: { id: string }; Body: UpdateDictionaryRequest }>("/:id", updateDictionary);
  fastify.delete<{ Params: { id: string } }>("/:id", deleteDictionary);
}
