import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initDatabase } from "./database";
import authRoutes from "./routes/auth";
import todoRoutes from "./routes/todos";
import categoryRoutes from "./routes/categories";
import tagRoutes from "./routes/tags";
import uploadRoutes from "./routes/upload";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/todos", todoRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/uploads", express.static("uploads"));

app.get("/api/health", (_, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || "服务器内部错误" });
});

const startServer = async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
