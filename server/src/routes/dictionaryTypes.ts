import { FastifyInstance } from "fastify";
import {
  getDictionaryTypes,
  createDictionaryType,
  updateDictionaryType,
  deleteDictionaryType,
} from "../controllers/dictionaryTypeController";
import { authMiddleware } from "../middlewares/auth";
import type {
  CreateDictionaryTypeRequest,
  UpdateDictionaryTypeRequest,
} from "@shared/types";

export default async function dictionaryTypeRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", authMiddleware);

  fastify.get("/", getDictionaryTypes);
  fastify.post<{ Body: CreateDictionaryTypeRequest }>("/", createDictionaryType);
  fastify.put<{ Params: { key: string }; Body: UpdateDictionaryTypeRequest }>("/:key", updateDictionaryType);
  fastify.delete<{ Params: { key: string } }>("/:key", deleteDictionaryType);
}
