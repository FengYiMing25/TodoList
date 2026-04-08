import { FastifyInstance } from "fastify";
import { register, login, getProfile, updateProfile } from "../controllers/authController";
import { authMiddleware } from "../middlewares/auth";
import type { LoginRequest, RegisterRequest, UpdateProfileRequest } from "@shared/types";

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: RegisterRequest }>("/register", register);
  fastify.post<{ Body: LoginRequest }>("/login", login);
  fastify.get("/profile", { preHandler: authMiddleware }, getProfile);
  fastify.put<{ Body: UpdateProfileRequest }>("/profile", { preHandler: authMiddleware }, updateProfile);
}
