import { FastifyRequest, FastifyReply } from "fastify";
import { v4 as uuidv4 } from "uuid";
import db from "../database";
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from "@shared/types";

interface CategoryRow {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

const formatCategory = (cat: CategoryRow): Category => ({
  id: cat.id,
  name: cat.name,
  color: cat.color,
  icon: cat.icon || undefined,
  userId: cat.user_id,
  createdAt: cat.created_at,
  updatedAt: cat.updated_at,
});

export const getCategories = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const categories = db.all<CategoryRow>(
    "SELECT * FROM categories WHERE user_id = ? ORDER BY created_at DESC",
    [request.userId]
  );

  return reply.send({
    success: true,
    data: categories.map(formatCategory),
  });
};

export const createCategory = async (
  request: FastifyRequest<{ Body: CreateCategoryRequest }>,
  reply: FastifyReply
) => {
  const { name, color, icon } = request.body;

  if (!name || !color) {
    return reply.code(400).send({ success: false, message: "名称和颜色不能为空" });
  }

  const categoryId = uuidv4();

  db.run(
    `INSERT INTO categories (id, name, color, icon, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [categoryId, name, color, icon, request.userId]
  );

  const category = db.get<CategoryRow>("SELECT * FROM categories WHERE id = ?", [categoryId]);

  return reply.code(201).send({
    success: true,
    data: formatCategory(category!),
  });
};

export const updateCategory = async (
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateCategoryRequest }>,
  reply: FastifyReply
) => {
  const { id } = request.params;
  const { name, color, icon } = request.body;

  const existingCategory = db.get<{ id: string }>(
    "SELECT id FROM categories WHERE id = ? AND user_id = ?",
    [id, request.userId]
  );

  if (!existingCategory) {
    return reply.code(404).send({ success: false, message: "分类不存在" });
  }

  db.run(
    `UPDATE categories SET name = COALESCE(?, name), color = COALESCE(?, color), icon = COALESCE(?, icon), updated_at = datetime('now') WHERE id = ?`,
    [name, color, icon, id]
  );

  const category = db.get<CategoryRow>("SELECT * FROM categories WHERE id = ?", [id]);

  return reply.send({
    success: true,
    data: formatCategory(category!),
  });
};

export const deleteCategory = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const { id } = request.params;

  const category = db.get<{ id: string }>(
    "SELECT id FROM categories WHERE id = ? AND user_id = ?",
    [id, request.userId]
  );

  if (!category) {
    return reply.code(404).send({ success: false, message: "分类不存在" });
  }

  db.run("DELETE FROM categories WHERE id = ?", [id]);

  return reply.send({ success: true, message: "删除成功" });
};
