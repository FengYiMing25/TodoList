import { FastifyRequest, FastifyReply } from "fastify";
import { v4 as uuidv4 } from "uuid";
import db from "../database";
import type {
  DictionaryTypeConfig,
  CreateDictionaryTypeRequest,
  UpdateDictionaryTypeRequest,
} from "@shared/types/dictionary";

interface DictionaryTypeRow {
  id: string;
  key: string;
  label: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

const formatDictionaryType = (row: DictionaryTypeRow): DictionaryTypeConfig => ({
  key: row.key,
  label: row.label,
  description: row.description || undefined,
  icon: row.icon || undefined,
  sortOrder: row.sort_order,
});

export const getDictionaryTypes = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const types = db.all<DictionaryTypeRow>(
    "SELECT * FROM dictionary_types ORDER BY sort_order ASC, created_at ASC"
  );

  return reply.send({
    success: true,
    data: types.map(formatDictionaryType),
  });
};

export const createDictionaryType = async (
  request: FastifyRequest<{ Body: CreateDictionaryTypeRequest }>,
  reply: FastifyReply
) => {
  const { key, label, description, icon, sortOrder } = request.body;

  if (!key || !label) {
    return reply.code(400).send({ success: false, message: "key和label不能为空" });
  }

  const existingType = db.get<DictionaryTypeRow>(
    "SELECT id FROM dictionary_types WHERE key = ?",
    [key]
  );
  if (existingType) {
    return reply.code(400).send({ success: false, message: "该字典类型key已存在" });
  }

  const typeId = uuidv4();
  const maxOrder = db.get<{ max: number }>("SELECT MAX(sort_order) as max FROM dictionary_types");
  const nextOrder = sortOrder ?? (maxOrder?.max ?? -1) + 1;

  db.run(
    `INSERT INTO dictionary_types (id, key, label, description, icon, sort_order, is_system, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, datetime('now'), datetime('now'))`,
    [typeId, key, label, description, icon, nextOrder, request.userId]
  );

  const dictionaryType = db.get<DictionaryTypeRow>(
    "SELECT * FROM dictionary_types WHERE id = ?",
    [typeId]
  );

  return reply.send({
    success: true,
    data: formatDictionaryType(dictionaryType!),
  });
};

export const updateDictionaryType = async (
  request: FastifyRequest<{ Params: { key: string }; Body: UpdateDictionaryTypeRequest }>,
  reply: FastifyReply
) => {
  const { key } = request.params;
  const { label, description, icon, sortOrder } = request.body;

  const existingType = db.get<DictionaryTypeRow>(
    "SELECT * FROM dictionary_types WHERE key = ?",
    [key]
  );
  if (!existingType) {
    return reply.code(404).send({ success: false, message: "字典类型不存在" });
  }

  db.run(
    `UPDATE dictionary_types SET label = COALESCE(?, label), description = COALESCE(?, description), icon = COALESCE(?, icon), sort_order = COALESCE(?, sort_order), updated_at = datetime('now') WHERE key = ?`,
    [label, description, icon, sortOrder, key]
  );

  const dictionaryType = db.get<DictionaryTypeRow>(
    "SELECT * FROM dictionary_types WHERE key = ?",
    [key]
  );

  return reply.send({
    success: true,
    data: formatDictionaryType(dictionaryType!),
  });
};

export const deleteDictionaryType = async (
  request: FastifyRequest<{ Params: { key: string } }>,
  reply: FastifyReply
) => {
  const { key } = request.params;

  const existingType = db.get<DictionaryTypeRow>(
    "SELECT * FROM dictionary_types WHERE key = ?",
    [key]
  );
  if (!existingType) {
    return reply.code(404).send({ success: false, message: "字典类型不存在" });
  }


  const dictionaryCount = db.get<{ count: number }>(
    "SELECT COUNT(*) as count FROM dictionaries WHERE type = ?",
    [key]
  );
  if (dictionaryCount && dictionaryCount.count > 0) {
    return reply.code(400).send({
      success: false,
      message: `该类型下有 ${dictionaryCount.count} 个字典项，请先删除字典项`,
    });
  }

  db.run("DELETE FROM dictionary_types WHERE key = ?", [key]);

  return reply.send({ success: true, message: "删除成功" });
};
