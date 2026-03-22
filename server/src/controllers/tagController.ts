import { FastifyRequest, FastifyReply } from "fastify";
import { v4 as uuidv4 } from "uuid";
import db from "../database";
import type { Tag, CreateTagRequest } from "@shared/types";

interface TagRow {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
}

const formatTag = (tag: TagRow): Tag => ({
  id: tag.id,
  name: tag.name,
  color: tag.color,
  userId: tag.user_id,
  createdAt: tag.created_at,
});

export const getTags = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const tags = db.all<TagRow>(
    "SELECT * FROM tags WHERE user_id = ? ORDER BY created_at DESC",
    [request.userId]
  );

  return reply.send({
    success: true,
    data: tags.map(formatTag),
  });
};

export const createTag = async (
  request: FastifyRequest<{ Body: CreateTagRequest }>,
  reply: FastifyReply
) => {
  const { name, color = "#1890ff" } = request.body;

  if (!name) {
    return reply.code(400).send({ success: false, message: "名称不能为空" });
  }

  const tagId = uuidv4();

  db.run(
    `INSERT INTO tags (id, name, color, user_id, created_at) VALUES (?, ?, ?, ?, datetime('now'))`,
    [tagId, name, color, request.userId]
  );

  const tag = db.get<TagRow>("SELECT * FROM tags WHERE id = ?", [tagId]);

  return reply.code(201).send({
    success: true,
    data: formatTag(tag!),
  });
};

export const deleteTag = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const { id } = request.params;

  const tag = db.get<{ id: string }>(
    "SELECT id FROM tags WHERE id = ? AND user_id = ?",
    [id, request.userId]
  );

  if (!tag) {
    return reply.code(404).send({ success: false, message: "标签不存在" });
  }

  db.run("DELETE FROM tags WHERE id = ?", [id]);

  return reply.send({ success: true, message: "删除成功" });
};
