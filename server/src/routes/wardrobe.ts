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
import type {
  CreateWardrobeRequest,
  DiscardWardrobeRequest,
  UpdateWardrobeRequest,
  WardrobeQueryParams,
} from "@shared/types";

export default async function wardrobeRoutes(fastify: FastifyInstance) {
  fastify.get("/statistics", { preHandler: authMiddleware }, getWardrobeStatistics);
  fastify.get<{ Querystring: WardrobeQueryParams }>("/", { preHandler: authMiddleware }, getWardrobeItems);
  fastify.get<{ Params: { id: string } }>("/:id", { preHandler: authMiddleware }, getWardrobeItemById);
  fastify.post<{ Body: CreateWardrobeRequest }>("/", { preHandler: authMiddleware }, createWardrobeItem);
  fastify.put<{ Params: { id: string }; Body: UpdateWardrobeRequest }>("/:id", { preHandler: authMiddleware }, updateWardrobeItem);
  fastify.post<{ Params: { id: string }; Body: DiscardWardrobeRequest }>("/:id/discard", { preHandler: authMiddleware }, discardWardrobeItem);
  fastify.delete<{ Params: { id: string } }>("/:id", { preHandler: authMiddleware }, deleteWardrobeItem);
}
