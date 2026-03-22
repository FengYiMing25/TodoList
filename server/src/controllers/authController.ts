import { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import db from "../database";
import { generateToken } from "../middlewares/auth";
import { deleteAttachmentsByEntity } from "../routes/upload";
import type { RegisterRequest, LoginRequest, User } from "@shared/types";

interface UpdateProfileBody {
  username?: string;
  email?: string;
  avatar?: string;
}

interface UserRow {
  id: string;
  username: string;
  email: string;
  password: string;
  avatar: string | null;
  created_at: string;
  updated_at: string;
}

const formatUser = (user: UserRow): User => ({
  id: user.id,
  username: user.username,
  email: user.email,
  avatar: user.avatar || undefined,
  createdAt: user.created_at,
  updatedAt: user.updated_at,
});

export const register = async (
  request: FastifyRequest<{ Body: RegisterRequest }>,
  reply: FastifyReply
) => {
  const { username, email, password } = request.body;

  if (!username || !email || !password) {
    return reply.code(400).send({ success: false, message: "请填写所有必填项" });
  }

  const existingUser = db.get<{ id: string }>(
    "SELECT id FROM users WHERE username = ? OR email = ?",
    [username, email]
  );

  if (existingUser) {
    return reply.code(400).send({ success: false, message: "用户名或邮箱已存在" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = uuidv4();

  db.run(
    `INSERT INTO users (id, username, email, password, created_at, updated_at) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [userId, username, email, hashedPassword]
  );

  const token = generateToken(userId);

  return reply.code(201).send({
    success: true,
    data: {
      user: {
        id: userId,
        username,
        email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      token,
    },
  });
};

export const login = async (
  request: FastifyRequest<{ Body: LoginRequest }>,
  reply: FastifyReply
) => {
  const { username, password } = request.body;

  if (!username || !password) {
    return reply.code(400).send({ success: false, message: "请输入用户名和密码" });
  }

  const user = db.get<UserRow>(
    "SELECT * FROM users WHERE username = ? OR email = ?",
    [username, username]
  );

  if (!user) {
    return reply.code(401).send({ success: false, message: "用户名或密码错误" });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return reply.code(401).send({ success: false, message: "用户名或密码错误" });
  }

  const token = generateToken(user.id);

  return reply.send({
    success: true,
    data: {
      user: formatUser(user),
      token,
    },
  });
};

export const getProfile = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const user = db.get<UserRow>(
    "SELECT id, username, email, avatar, created_at, updated_at FROM users WHERE id = ?",
    [request.userId!]
  );

  if (!user) {
    return reply.code(404).send({ success: false, message: "用户不存在" });
  }

  return reply.send({
    success: true,
    data: formatUser(user),
  });
};

export const updateProfile = async (
  request: FastifyRequest<{ Body: UpdateProfileBody }>,
  reply: FastifyReply
) => {
  const { username, email, avatar } = request.body;

  const oldUser = db.get<UserRow>(
    "SELECT avatar FROM users WHERE id = ?",
    [request.userId!]
  );

  if (oldUser?.avatar && avatar && oldUser.avatar !== avatar) {
    const oldAttachment = db.get<{ id: string; filename: string }>(
      "SELECT id, filename FROM attachments WHERE url = ?",
      [oldUser.avatar]
    );
    if (oldAttachment) {
      const { deleteAttachmentFile } = await import("../routes/upload");
      deleteAttachmentFile(oldAttachment.filename);
      db.run("DELETE FROM attachments WHERE id = ?", [oldAttachment.id]);
    }
  }

  if (avatar && avatar !== oldUser?.avatar) {
    db.run(
      `UPDATE attachments SET entity_type = ?, entity_id = ? WHERE url = ?`,
      ["user", request.userId!, avatar]
    );
  }

  db.run(
    `UPDATE users SET username = COALESCE(?, username), email = COALESCE(?, email), avatar = COALESCE(?, avatar), updated_at = datetime('now') WHERE id = ?`,
    [username, email, avatar, request.userId]
  );

  const user = db.get<UserRow>(
    "SELECT id, username, email, avatar, created_at, updated_at FROM users WHERE id = ?",
    [request.userId!]
  );

  return reply.send({
    success: true,
    data: formatUser(user!),
  });
};
