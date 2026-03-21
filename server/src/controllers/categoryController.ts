import { Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { AuthRequest } from "../types";
import db from "../database";
import { asyncHandler } from "../middlewares";

interface CategoryRow {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface TagRow {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
}

export const getCategories = asyncHandler(async (req: AuthRequest, res: Response) => {
  const categories = db.all<CategoryRow>("SELECT * FROM categories WHERE user_id = ? ORDER BY created_at DESC", [req.userId]);

  res.json({
    success: true,
    data: categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
      userId: cat.user_id,
      createdAt: cat.created_at,
      updatedAt: cat.updated_at,
    })),
  });
});

export const createCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, color, icon } = req.body;

  if (!name || !color) {
    res.status(400).json({ success: false, message: "名称和颜色不能为空" });
    return;
  }

  const categoryId = uuidv4();

  db.run(`INSERT INTO categories (id, name, color, icon, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`, [categoryId, name, color, icon, req.userId]);

  const category = db.get<CategoryRow>("SELECT * FROM categories WHERE id = ?", [categoryId]);

  res.status(201).json({
    success: true,
    data: {
      id: category?.id,
      name: category?.name,
      color: category?.color,
      icon: category?.icon,
      userId: category?.user_id,
      createdAt: category?.created_at,
      updatedAt: category?.updated_at,
    },
  });
});

export const updateCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, color, icon } = req.body;

  const existingCategory = db.get<{ id: string }>("SELECT id FROM categories WHERE id = ? AND user_id = ?", [id, req.userId]);

  if (!existingCategory) {
    res.status(404).json({ success: false, message: "分类不存在" });
    return;
  }

  db.run(`UPDATE categories SET name = COALESCE(?, name), color = COALESCE(?, color), icon = COALESCE(?, icon), updated_at = datetime('now') WHERE id = ?`, [name, color, icon, id]);

  const category = db.get<CategoryRow>("SELECT * FROM categories WHERE id = ?", [id]);

  res.json({
    success: true,
    data: {
      id: category?.id,
      name: category?.name,
      color: category?.color,
      icon: category?.icon,
      userId: category?.user_id,
      createdAt: category?.created_at,
      updatedAt: category?.updated_at,
    },
  });
});

export const deleteCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const category = db.get<{ id: string }>("SELECT id FROM categories WHERE id = ? AND user_id = ?", [id, req.userId]);

  if (!category) {
    res.status(404).json({ success: false, message: "分类不存在" });
    return;
  }

  db.run("DELETE FROM categories WHERE id = ?", [id]);

  res.json({ success: true, message: "删除成功" });
});

export const getTags = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tags = db.all<TagRow>("SELECT * FROM tags WHERE user_id = ? ORDER BY created_at DESC", [req.userId]);

  res.json({
    success: true,
    data: tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      userId: tag.user_id,
      createdAt: tag.created_at,
    })),
  });
});

export const createTag = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, color = "#1890ff" } = req.body;

  if (!name) {
    res.status(400).json({ success: false, message: "名称不能为空" });
    return;
  }

  const tagId = uuidv4();

  db.run(`INSERT INTO tags (id, name, color, user_id, created_at) VALUES (?, ?, ?, ?, datetime('now'))`, [tagId, name, color, req.userId]);

  const tag = db.get<TagRow>("SELECT * FROM tags WHERE id = ?", [tagId]);

  res.status(201).json({
    success: true,
    data: {
      id: tag?.id,
      name: tag?.name,
      color: tag?.color,
      userId: tag?.user_id,
      createdAt: tag?.created_at,
    },
  });
});

export const deleteTag = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const tag = db.get<{ id: string }>("SELECT id FROM tags WHERE id = ? AND user_id = ?", [id, req.userId]);

  if (!tag) {
    res.status(404).json({ success: false, message: "标签不存在" });
    return;
  }

  db.run("DELETE FROM tags WHERE id = ?", [id]);

  res.json({ success: true, message: "删除成功" });
});
