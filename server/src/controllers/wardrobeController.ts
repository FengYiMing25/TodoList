import { FastifyRequest, FastifyReply } from "fastify";
import { v4 as uuidv4 } from "uuid";
import db from "../database";
import { deleteAttachmentsByEntity } from "../routes/upload";
import type {
  WardrobeItem,
  CreateWardrobeRequest,
  UpdateWardrobeRequest,
  DiscardWardrobeRequest,
  WardrobeQueryParams,
  WardrobeStatistics,
  CategoryStatistic,
} from "@shared/types";

interface WardrobeRow {
  id: string;
  name: string;
  category: string;
  price: number;
  purchase_date: string;
  image_url: string | null;
  status: string;
  discard_date: string | null;
  discard_reason: string | null;
  description: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

const calculateUsageDays = (purchaseDate: string, discardDate?: string): number => {
  const start = new Date(purchaseDate);
  const end = discardDate ? new Date(discardDate) : new Date();
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const formatWardrobeItem = (row: WardrobeRow): WardrobeItem => {
  const usageDays = calculateUsageDays(row.purchase_date, row.discard_date || undefined);
  return {
    id: row.id,
    name: row.name,
    category: row.category as WardrobeItem["category"],
    price: row.price,
    purchaseDate: row.purchase_date,
    imageUrl: row.image_url || undefined,
    status: row.status as WardrobeItem["status"],
    discardDate: row.discard_date || undefined,
    discardReason: row.discard_reason || undefined,
    description: row.description || undefined,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    usageDays,
    dailyValue: row.price / Math.max(usageDays, 1),
  };
};

export const getWardrobeItems = async (
  request: FastifyRequest<{ Querystring: WardrobeQueryParams }>,
  reply: FastifyReply
) => {
  const {
    page = 1,
    limit = 10,
    category,
    status,
    keyword,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = request.query;

  const sortByMap: Record<string, string> = {
    createdAt: "created_at",
    price: "price",
    purchaseDate: "purchase_date",
    usageDays: "purchase_date",
  };
  const dbSortBy = sortByMap[sortBy] || "created_at";

  let sql = `SELECT * FROM wardrobe WHERE user_id = ?`;
  const params: unknown[] = [request.userId];

  if (category) {
    sql += " AND category = ?";
    params.push(category);
  }
  if (status) {
    sql += " AND status = ?";
    params.push(status);
  }
  if (keyword) {
    sql += " AND (name LIKE ? OR description LIKE ?)";
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const countSql = sql.replace("SELECT *", "SELECT COUNT(*) as total");
  const countResult = db.get<{ total: number }>(countSql, params);
  const total = countResult?.total || 0;

  sql += ` ORDER BY ${dbSortBy} ${sortOrder === "asc" ? "ASC" : "DESC"} LIMIT ? OFFSET ?`;
  params.push(Number(limit), (Number(page) - 1) * Number(limit));

  const items = db.all<WardrobeRow>(sql, params);

  return reply.send({
    success: true,
    data: {
      items: items.map(formatWardrobeItem),
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
};

export const getWardrobeItemById = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const { id } = request.params;

  const item = db.get<WardrobeRow>(
    `SELECT * FROM wardrobe WHERE id = ? AND user_id = ?`,
    [id, request.userId]
  );

  if (!item) {
    return reply.code(404).send({ success: false, message: "物品不存在" });
  }

  return reply.send({
    success: true,
    data: formatWardrobeItem(item),
  });
};

export const createWardrobeItem = async (
  request: FastifyRequest<{ Body: CreateWardrobeRequest }>,
  reply: FastifyReply
) => {
  const { name, category, price, purchaseDate, imageUrl, description } = request.body;

  if (!name || !category || !price || !purchaseDate) {
    return reply.code(400).send({ success: false, message: "名称、分类、价格和购买日期不能为空" });
  }

  const itemId = uuidv4();

  db.run(
    `INSERT INTO wardrobe (id, name, category, price, purchase_date, image_url, description, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [itemId, name, category, price, purchaseDate, imageUrl, description, request.userId]
  );

  if (imageUrl) {
    db.run(
      `UPDATE attachments SET entity_type = ?, entity_id = ? WHERE url = ?`,
      ["wardrobe", itemId, imageUrl]
    );
  }

  const item = db.get<WardrobeRow>("SELECT * FROM wardrobe WHERE id = ?", [itemId]);

  return reply.code(201).send({
    success: true,
    data: formatWardrobeItem(item!),
  });
};

export const updateWardrobeItem = async (
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateWardrobeRequest }>,
  reply: FastifyReply
) => {
  const { id } = request.params;
  const { name, category, price, purchaseDate, imageUrl, description } = request.body;

  const existingItem = db.get<WardrobeRow>(
    "SELECT * FROM wardrobe WHERE id = ? AND user_id = ?",
    [id, request.userId]
  );

  if (!existingItem) {
    return reply.code(404).send({ success: false, message: "物品不存在" });
  }

  if (imageUrl && imageUrl !== existingItem.image_url) {
    if (existingItem.image_url) {
      const oldAttachment = db.get<{ id: string; filename: string }>(
        "SELECT id, filename FROM attachments WHERE url = ?",
        [existingItem.image_url]
      );
      if (oldAttachment) {
        const { deleteAttachmentFile } = await import("../routes/upload");
        deleteAttachmentFile(oldAttachment.filename);
        db.run("DELETE FROM attachments WHERE id = ?", [oldAttachment.id]);
      }
    }
    db.run(
      `UPDATE attachments SET entity_type = ?, entity_id = ? WHERE url = ?`,
      ["wardrobe", id, imageUrl]
    );
  }

  db.run(
    `UPDATE wardrobe SET name = COALESCE(?, name), category = COALESCE(?, category), price = COALESCE(?, price), purchase_date = COALESCE(?, purchase_date), image_url = COALESCE(?, image_url), description = COALESCE(?, description), updated_at = datetime('now') WHERE id = ?`,
    [name, category, price, purchaseDate, imageUrl, description, id]
  );

  const item = db.get<WardrobeRow>("SELECT * FROM wardrobe WHERE id = ?", [id]);

  return reply.send({
    success: true,
    data: formatWardrobeItem(item!),
  });
};

export const discardWardrobeItem = async (
  request: FastifyRequest<{ Params: { id: string }; Body: DiscardWardrobeRequest }>,
  reply: FastifyReply
) => {
  const { id } = request.params;
  const { discardDate, discardReason } = request.body;

  if (!discardDate) {
    return reply.code(400).send({ success: false, message: "出库日期不能为空" });
  }

  const existingItem = db.get<WardrobeRow>(
    "SELECT * FROM wardrobe WHERE id = ? AND user_id = ?",
    [id, request.userId]
  );

  if (!existingItem) {
    return reply.code(404).send({ success: false, message: "物品不存在" });
  }

  if (existingItem.status === "discarded") {
    return reply.code(400).send({ success: false, message: "该物品已出库" });
  }

  db.run(
    `UPDATE wardrobe SET status = 'discarded', discard_date = ?, discard_reason = ?, updated_at = datetime('now') WHERE id = ?`,
    [discardDate, discardReason, id]
  );

  const item = db.get<WardrobeRow>("SELECT * FROM wardrobe WHERE id = ?", [id]);

  return reply.send({
    success: true,
    data: formatWardrobeItem(item!),
  });
};

export const deleteWardrobeItem = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const { id } = request.params;

  const item = db.get<WardrobeRow>(
    "SELECT * FROM wardrobe WHERE id = ? AND user_id = ?",
    [id, request.userId]
  );

  if (!item) {
    return reply.code(404).send({ success: false, message: "物品不存在" });
  }

  deleteAttachmentsByEntity("wardrobe", id);

  db.run("DELETE FROM wardrobe WHERE id = ?", [id]);

  return reply.send({ success: true, message: "删除成功" });
};

export const getWardrobeStatistics = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const totalSql = `SELECT COUNT(*) as count, COALESCE(SUM(price), 0) as total FROM wardrobe WHERE user_id = ?`;
  const totalResult = db.get<{ count: number; total: number }>(totalSql, [request.userId]);

  const inUseSql = `SELECT COUNT(*) as count FROM wardrobe WHERE user_id = ? AND status = 'in_use'`;
  const inUseResult = db.get<{ count: number }>(inUseSql, [request.userId]);

  const discardedSql = `SELECT COUNT(*) as count FROM wardrobe WHERE user_id = ? AND status = 'discarded'`;
  const discardedResult = db.get<{ count: number }>(discardedSql, [request.userId]);

  const categorySql = `
    SELECT category, COUNT(*) as count, COALESCE(SUM(price), 0) as totalValue
    FROM wardrobe 
    WHERE user_id = ?
    GROUP BY category
    ORDER BY count DESC
  `;
  const categoryStats = db.all<CategoryStatistic>(categorySql, [request.userId]);

  const items = db.all<WardrobeRow>("SELECT * FROM wardrobe WHERE user_id = ?", [request.userId]);
  const totalUsageDays = items.reduce((sum, item) => {
    return sum + calculateUsageDays(item.purchase_date, item.discard_date || undefined);
  }, 0);

  const stats: WardrobeStatistics = {
    totalItems: totalResult?.count || 0,
    inUseCount: inUseResult?.count || 0,
    discardedCount: discardedResult?.count || 0,
    totalValue: totalResult?.total || 0,
    avgUsageDays: items.length > 0 ? Math.round(totalUsageDays / items.length) : 0,
    categoryStats,
  };

  return reply.send({
    success: true,
    data: stats,
  });
};
