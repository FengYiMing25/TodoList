import { FastifyInstance } from "fastify";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import db from "../database";
import { authMiddleware } from "../middlewares/auth";

const uploadDir = process.env.UPLOAD_DIR || "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_TYPES = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|zip/;
const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;

const deleteAttachmentFile = (filename: string) => {
  const filePath = path.join(uploadDir, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const deleteAttachmentsByEntity = (entityType: string, entityId: string) => {
  const attachments = db.all<{ filename: string }>(
    "SELECT filename FROM attachments WHERE entity_type = ? AND entity_id = ?",
    [entityType, entityId]
  );
  
  attachments.forEach((att) => {
    deleteAttachmentFile(att.filename);
  });
  
  db.run(
    "DELETE FROM attachments WHERE entity_type = ? AND entity_id = ?",
    [entityType, entityId]
  );
};

export default async function uploadRoutes(fastify: FastifyInstance) {
  fastify.post("/", {
    preHandler: authMiddleware,
  }, async (request, reply) => {
    const parts = request.parts();
    let fileData: { filename: string; mimetype: string; buffer: Buffer } | null = null;
    let todoId: string | undefined;
    let entityType: string | undefined;
    let entityId: string | undefined;

    for await (const part of parts) {
      if (part.type === "field") {
        if (part.fieldname === "todoId") {
          todoId = part.value as string;
        } else if (part.fieldname === "entityType") {
          entityType = part.value as string;
        } else if (part.fieldname === "entityId") {
          entityId = part.value as string;
        }
      } else if (part.type === "file") {
        const buffer = await part.toBuffer();
        fileData = {
          filename: part.filename,
          mimetype: part.mimetype,
          buffer,
        };
      }
    }

    if (!fileData) {
      return reply.code(400).send({ success: false, message: "请选择文件" });
    }

    const ext = path.extname(fileData.filename).toLowerCase();
    const isValidExt = ALLOWED_TYPES.test(ext);
    const isValidMime = ALLOWED_TYPES.test(fileData.mimetype);

    if (!isValidExt || !isValidMime) {
      return reply.code(400).send({ success: false, message: "不支持的文件类型" });
    }

    if (fileData.buffer.length > MAX_FILE_SIZE) {
      return reply.code(400).send({ success: false, message: "文件大小超过限制" });
    }

    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, fileData.buffer);

    const attachmentId = uuidv4();
    const fileUrl = `/uploads/${filename}`;

    db.run(
      `INSERT INTO attachments (id, filename, original_name, mime_type, size, url, entity_type, entity_id, todo_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [attachmentId, filename, fileData.filename, fileData.mimetype, fileData.buffer.length, fileUrl, entityType || null, entityId || null, todoId || null]
    );

    return reply.code(201).send({
      success: true,
      data: {
        attachment: {
          id: attachmentId,
          filename,
          originalName: fileData.filename,
          mimeType: fileData.mimetype,
          size: fileData.buffer.length,
          url: fileUrl,
          entityType,
          entityId,
          todoId,
          createdAt: new Date().toISOString(),
        },
      },
    });
  });

  fastify.delete("/:id", { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const attachment = db.get<{ id: string; filename: string }>(
      "SELECT * FROM attachments WHERE id = ?",
      [id]
    );

    if (!attachment) {
      return reply.code(404).send({ success: false, message: "附件不存在" });
    }

    deleteAttachmentFile(attachment.filename);
    db.run("DELETE FROM attachments WHERE id = ?", [id]);

    return reply.send({ success: true, message: "删除成功" });
  });

  fastify.delete("/entity/:entityType/:entityId", { preHandler: authMiddleware }, async (request, reply) => {
    const { entityType, entityId } = request.params as { entityType: string; entityId: string };

    deleteAttachmentsByEntity(entityType, entityId);

    return reply.send({ success: true, message: "关联附件已删除" });
  });
}

export { deleteAttachmentsByEntity, deleteAttachmentFile };
