import { v4 as uuidv4 } from "uuid";
import db from "../database";

export interface DefaultDictionary {
  name: string;
  color: string;
}

export interface DefaultDictionaryType {
  key: string;
  label: string;
  description: string;
  items: DefaultDictionary[];
}

const DEFAULT_DICTIONARY_TYPES: DefaultDictionaryType[] = [
  {
    key: "account_income_category",
    label: "收入分类",
    description: "记账本收入分类",
    items: [
      { name: "工资", color: "#52c41a" },
      { name: "奖金", color: "#73d13d" },
      { name: "理财", color: "#95de64" },
      { name: "兼职", color: "#b7eb8f" },
      { name: "红包", color: "#d3f261" },
      { name: "其他收入", color: "#f6ffed" },
    ],
  },
  {
    key: "account_expense_category",
    label: "支出分类",
    description: "记账本支出分类",
    items: [
      { name: "餐饮", color: "#ff4d4f" },
      { name: "交通", color: "#ff7a45" },
      { name: "购物", color: "#ffa940" },
      { name: "娱乐", color: "#ffec3d" },
      { name: "居住", color: "#bae637" },
      { name: "通讯", color: "#73d13d" },
      { name: "医疗", color: "#36cfc9" },
      { name: "教育", color: "#40a9ff" },
      { name: "其他支出", color: "#597ef7" },
    ],
  },
  {
    key: "wardrobe_category",
    label: "衣橱分类",
    description: "电子衣橱分类",
    items: [
      { name: "上衣", color: "#f5222d" },
      { name: "裤子", color: "#fa541c" },
      { name: "裙子", color: "#fa8c16" },
      { name: "外套", color: "#faad14" },
      { name: "鞋子", color: "#a0d911" },
      { name: "包包", color: "#52c41a" },
      { name: "配饰", color: "#13c2c2" },
      { name: "其他", color: "#1890ff" },
    ],
  },
  {
    key: "todo_tag",
    label: "待办标签",
    description: "待办事项标签",
    items: [
      { name: "工作", color: "#1890ff" },
      { name: "学习", color: "#52c41a" },
      { name: "生活", color: "#faad14" },
      { name: "健康", color: "#ff4d4f" },
      { name: "娱乐", color: "#722ed1" },
      { name: "其他", color: "#13c2c2" },
    ],
  },
];

export const initializeDefaultDictionaries = (userId: string): void => {
  DEFAULT_DICTIONARY_TYPES.forEach((typeConfig, typeIndex) => {
    const typeId = uuidv4();
    
    const existingType = db.get<{ id: string }>(
      "SELECT id FROM dictionary_types WHERE key = ?",
      [typeConfig.key]
    );

    if (!existingType) {
      db.run(
        `INSERT INTO dictionary_types (id, key, label, description, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [typeId, typeConfig.key, typeConfig.label, typeConfig.description, typeIndex]
      );
    }

    typeConfig.items.forEach((item, itemIndex) => {
      const existingItem = db.get<{ id: string }>(
        "SELECT id FROM dictionaries WHERE type = ? AND name = ? AND user_id = ?",
        [typeConfig.key, item.name, userId]
      );

      if (!existingItem) {
        const itemId = uuidv4();
        db.run(
          `INSERT INTO dictionaries (id, type, name, color, sort_order, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [itemId, typeConfig.key, item.name, item.color, itemIndex, userId]
        );
      }
    });
  });

  console.log(`Default dictionaries initialized for user ${userId}`);
};

export const initializeDefaultDictionariesForType = (userId: string, type: string): number => {
  const typeConfig = DEFAULT_DICTIONARY_TYPES.find(t => t.key === type);
  if (!typeConfig) return 0;

  let addedCount = 0;

  const existingType = db.get<{ id: string }>(
    "SELECT id FROM dictionary_types WHERE key = ?",
    [typeConfig.key]
  );

  if (!existingType) {
    const typeId = uuidv4();
    db.run(
      `INSERT INTO dictionary_types (id, key, label, description, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [typeId, typeConfig.key, typeConfig.label, typeConfig.description, 0]
    );
  }

  typeConfig.items.forEach((item, itemIndex) => {
    const existingItem = db.get<{ id: string }>(
      "SELECT id FROM dictionaries WHERE type = ? AND name = ? AND user_id = ?",
      [typeConfig.key, item.name, userId]
    );

    if (!existingItem) {
      const itemId = uuidv4();
      db.run(
        `INSERT INTO dictionaries (id, type, name, color, sort_order, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [itemId, typeConfig.key, item.name, item.color, itemIndex, userId]
      );
      addedCount++;
    }
  });

  return addedCount;
};

export { DEFAULT_DICTIONARY_TYPES };
