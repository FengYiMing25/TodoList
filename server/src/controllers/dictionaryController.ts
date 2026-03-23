import { FastifyRequest, FastifyReply } from "fastify";
import { v4 as uuidv4 } from "uuid";
import db from "../database";
import { initializeDefaultDictionariesForType, DEFAULT_DICTIONARY_TYPES } from "../utils/initDefaultData";
import type {
  Dictionary,
  CreateDictionaryRequest,
  UpdateDictionaryRequest,
  DictionaryType,
} from "@shared/types/dictionary";

interface DictionaryRow {
  id: string;
  type: string;
  name: string;
  color: string;
  icon: string | null;
  sort_order: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

const formatDictionary = (dict: DictionaryRow): Dictionary => ({
  id: dict.id,
  type: dict.type as DictionaryType,
  name: dict.name,
  color: dict.color,
  icon: dict.icon || undefined,
  sortOrder: dict.sort_order,
  userId: dict.user_id,
  createdAt: dict.created_at,
  updatedAt: dict.updated_at,
});

export const getDictionaries = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const query = request.query as { type?: DictionaryType };
  const { type } = query;

  let sql = "SELECT * FROM dictionaries WHERE user_id = ?";
  const params: unknown[] = [request.userId];

  if (type) {
    sql += " AND type = ?";
    params.push(type);
  }

  sql += " ORDER BY sort_order ASC, created_at DESC";

  const dictionaries = db.all<DictionaryRow>(sql, params);

  return reply.send({
    success: true,
    data: dictionaries.map(formatDictionary),
  });
};

export const getDictionaryById = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: string };

  const dictionary = db.get<DictionaryRow>(
    "SELECT * FROM dictionaries WHERE id = ? AND user_id = ?",
    [id, request.userId]
  );

  if (!dictionary) {
    return reply.code(404).send({ success: false, message: "字典项不存在" });
  }

  return reply.send({
    success: true,
    data: formatDictionary(dictionary),
  });
};

export const createDictionary = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const body = request.body as CreateDictionaryRequest;
  const { type, name, color, icon, sortOrder } = body;

  if (!type || !name || !color) {
    return reply.code(400).send({ success: false, message: "类型、名称和颜色不能为空" });
  }

  const dictId = uuidv4();

  db.run(
    `INSERT INTO dictionaries (id, type, name, color, icon, sort_order, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [dictId, type, name, color, icon, sortOrder || 0, request.userId]
  );

  const dictionary = db.get<DictionaryRow>("SELECT * FROM dictionaries WHERE id = ?", [dictId]);

  return reply.code(201).send({
    success: true,
    data: formatDictionary(dictionary!),
  });
};

export const updateDictionary = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: string };
  const body = request.body as UpdateDictionaryRequest;
  const { name, color, icon, sortOrder } = body;

  const existingDict = db.get<{ id: string }>(
    "SELECT id FROM dictionaries WHERE id = ? AND user_id = ?",
    [id, request.userId]
  );

  if (!existingDict) {
    return reply.code(404).send({ success: false, message: "字典项不存在" });
  }

  db.run(
    `UPDATE dictionaries SET name = COALESCE(?, name), color = COALESCE(?, color), icon = COALESCE(?, icon), sort_order = COALESCE(?, sort_order), updated_at = datetime('now') WHERE id = ?`,
    [name, color, icon, sortOrder, id]
  );

  const dictionary = db.get<DictionaryRow>("SELECT * FROM dictionaries WHERE id = ?", [id]);

  return reply.send({
    success: true,
    data: formatDictionary(dictionary!),
  });
};

export const deleteDictionary = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: string };

  const dictionary = db.get<{ id: string }>(
    "SELECT id FROM dictionaries WHERE id = ? AND user_id = ?",
    [id, request.userId]
  );

  if (!dictionary) {
    return reply.code(404).send({ success: false, message: "字典项不存在" });
  }

  db.run("DELETE FROM dictionaries WHERE id = ?", [id]);

  return reply.send({ success: true, message: "删除成功" });
};

export const initDefaultDictionaries = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const body = request.body as { type?: DictionaryType };
  const { type } = body;

  if (type) {
    const addedCount = initializeDefaultDictionariesForType(request.userId!, type);
    return reply.send({
      success: true,
      message: `成功初始化 ${addedCount} 个默认分类`,
      data: { addedCount },
    });
  }

  let totalAdded = 0;
  DEFAULT_DICTIONARY_TYPES.forEach((typeConfig) => {
    totalAdded += initializeDefaultDictionariesForType(request.userId!, typeConfig.key);
  });

  return reply.send({
    success: true,
    message: `成功初始化 ${totalAdded} 个默认分类`,
    data: { addedCount: totalAdded },
  });
};

export const getDictionaryTypes = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const types = db.all<{
    id: string;
    key: string;
    label: string;
    description: string | null;
    icon: string | null;
    sort_order: number;
  }>("SELECT * FROM dictionary_types ORDER BY sort_order ASC");

  return reply.send({
    success: true,
    data: types,
  });
};
