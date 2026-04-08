import { FastifyInstance } from "fastify";
import {
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
  toggleTodoStatus,
} from "../controllers/todoController";
import { authMiddleware } from "../middlewares/auth";
import type {
  CreateTodoRequest,
  TodoQueryParams,
  UpdateTodoRequest,
} from "@shared/types";

export default async function todoRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: TodoQueryParams }>("/", { preHandler: authMiddleware }, getTodos);
  fastify.get<{ Params: { id: string } }>("/:id", { preHandler: authMiddleware }, getTodoById);
  fastify.post<{ Body: CreateTodoRequest }>("/", { preHandler: authMiddleware }, createTodo);
  fastify.put<{ Params: { id: string }; Body: UpdateTodoRequest }>("/:id", { preHandler: authMiddleware }, updateTodo);
  fastify.delete<{ Params: { id: string } }>("/:id", { preHandler: authMiddleware }, deleteTodo);
  fastify.patch<{ Params: { id: string } }>("/:id/toggle", { preHandler: authMiddleware }, toggleTodoStatus);
}
