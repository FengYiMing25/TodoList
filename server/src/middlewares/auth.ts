import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";

declare module "fastify" {
  interface FastifyRequest {
    userId?: string;
  }
}

export const authMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    reply.code(401).send({ success: false, message: "未授权访问" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret"
    ) as { userId: string };
    request.userId = decoded.userId;
  } catch {
    reply.code(401).send({ success: false, message: "Token无效或已过期" });
    return;
  }
};

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "secret", {
    expiresIn: "7d",
  });
};
