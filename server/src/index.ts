import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import compress from "@fastify/compress";
import rateLimit from "@fastify/rate-limit";
import staticPlugin from "@fastify/static";
import multipart from "@fastify/multipart";
import dotenv from "dotenv";
import path from "path";
import { initDatabase } from "./database";
import authRoutes from "./routes/auth";
import todoRoutes from "./routes/todos";
import uploadRoutes from "./routes/upload";
import accountRoutes from "./routes/accounts";
import wardrobeRoutes from "./routes/wardrobe";
import dictionaryRoutes from "./routes/dictionaries";
import dictionaryTypeRoutes from "./routes/dictionaryTypes";

dotenv.config();

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    transport: process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
  },
  trustProxy: true,
});

const PORT = Number(process.env.PORT) || 3001;

const startServer = async () => {
  try {
    await fastify.register(helmet, {
      crossOriginResourcePolicy: { policy: "cross-origin" },
    });

    await fastify.register(cors, {
      origin: true,
      credentials: true,
    });

    await fastify.register(compress, {
      global: true,
      encodings: ["gzip", "deflate", "br"],
    });

    await fastify.register(rateLimit, {
      max: 100,
      timeWindow: "1 minute",
      cache: 10000,
      allowList: ["127.0.0.1"],
      keyGenerator: (request) => {
        return request.ip;
      },
    });

    await fastify.register(staticPlugin, {
      root: path.join(__dirname, "../uploads"),
      prefix: "/uploads/",
    });

    await fastify.register(multipart, {
      limits: {
        fileSize: Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024,
        files: 1,
      },
    });

    fastify.get("/api/health", async () => ({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    }));

    await fastify.register(authRoutes, { prefix: "/api/auth" });
    await fastify.register(todoRoutes, { prefix: "/api/todos" });
    await fastify.register(uploadRoutes, { prefix: "/api/upload" });
    await fastify.register(accountRoutes, { prefix: "/api/accounts" });
    await fastify.register(wardrobeRoutes, { prefix: "/api/wardrobe" });
    await fastify.register(dictionaryRoutes, { prefix: "/api/dictionaries" });
    await fastify.register(dictionaryTypeRoutes, { prefix: "/api/dictionary-types" });

    fastify.setErrorHandler((error, request, reply) => {
      fastify.log.error(error);
      reply.status(error.statusCode || 500).send({
        success: false,
        message: error.message || "服务器内部错误",
      });
    });

    await initDatabase();

    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`🚀 Fastify server running on http://localhost:${PORT}`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

startServer();

export default fastify;
