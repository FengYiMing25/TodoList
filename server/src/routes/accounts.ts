import { FastifyInstance } from "fastify";
import {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  getStatistics,
} from "../controllers/accountController";
import { authMiddleware } from "../middlewares/auth";

export default async function accountRoutes(fastify: FastifyInstance) {
  fastify.get("/statistics", { preHandler: authMiddleware }, getStatistics);
  fastify.get("/", { preHandler: authMiddleware }, getAccounts);
  fastify.get("/:id", { preHandler: authMiddleware }, getAccountById);
  fastify.post("/", { preHandler: authMiddleware }, createAccount);
  fastify.put("/:id", { preHandler: authMiddleware }, updateAccount);
  fastify.delete("/:id", { preHandler: authMiddleware }, deleteAccount);
}
