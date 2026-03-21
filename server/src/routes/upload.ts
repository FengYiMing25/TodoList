import { Router, Response } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { AuthRequest } from "../types";
import db from "../database";
import { authMiddleware, asyncHandler } from "../middlewares";

const router = Router();

const uploadDir = process.env.UPLOAD_DIR || "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("不支持的文件类型"));
    }
  },
});

router.post(
  "/",
  authMiddleware,
  upload.single("file"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      res.status(400).json({ success: false, message: "请选择文件" });
      return;
    }

    const { todoId } = req.body;

    const attachmentId = uuidv4();
    const fileUrl = `/uploads/${req.file.filename}`;

    db.run(`INSERT INTO attachments (id, filename, original_name, mime_type, size, url, todo_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`, [
      attachmentId,
      req.file.filename,
      req.file.originalname,
      req.file.mimetype,
      req.file.size,
      fileUrl,
      todoId,
    ]);

    res.status(201).json({
      success: true,
      data: {
        attachment: {
          id: attachmentId,
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          url: fileUrl,
          todoId,
          createdAt: new Date().toISOString(),
        },
      },
    });
  }),
);

router.delete(
  "/:id",
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const attachment = db.get<{ id: string; filename: string }>("SELECT a.*, t.user_id FROM attachments a JOIN todos t ON a.todo_id = t.id WHERE a.id = ?", [id]);

    if (!attachment) {
      res.status(404).json({ success: false, message: "附件不存在" });
      return;
    }

    const filePath = path.join(uploadDir, attachment.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    db.run("DELETE FROM attachments WHERE id = ?", [id]);

    res.json({ success: true, message: "删除成功" });
  }),
);

export default router;
