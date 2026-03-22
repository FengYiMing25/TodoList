import { FastifyInstance } from "fastify";
import { register, login, getProfile, updateProfile } from "../controllers/authController";
import { authMiddleware } from "../middlewares/auth";

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/register", register);
  fastify.post("/login", login);
  fastify.get("/profile", { preHandler: authMiddleware }, getProfile);
  fastify.put("/profile", { preHandler: authMiddleware }, updateProfile);
}
