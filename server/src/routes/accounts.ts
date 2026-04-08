import { FastifyInstance } from "fastify";
import { getAccounts, getAccountById, createAccount, updateAccount, deleteAccount, getStatistics } from "../controllers/accountController";
import { authMiddleware } from "../middlewares/auth";
import type { AccountQueryParams, CreateAccountRequest, UpdateAccountRequest } from "@shared/types";

export default async function accountRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: { startDate?: string; endDate?: string } }>("/statistics", { preHandler: [authMiddleware] }, getStatistics);
  fastify.get<{ Querystring: AccountQueryParams }>("/", { preHandler: [authMiddleware] }, getAccounts);
  fastify.get<{ Params: { id: string } }>("/:id", { preHandler: [authMiddleware] }, getAccountById);
  fastify.post<{ Body: CreateAccountRequest }>("/", { preHandler: [authMiddleware] }, createAccount);
  fastify.put<{ Params: { id: string }; Body: UpdateAccountRequest }>("/:id", { preHandler: [authMiddleware] }, updateAccount);
  fastify.delete<{ Params: { id: string } }>("/:id", { preHandler: [authMiddleware] }, deleteAccount);
}
