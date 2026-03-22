import initSqlJs, { Database } from "sql.js";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

let db: Database;
const dbPath = path.resolve(__dirname, "../data.db");

export const initDatabase = async (): Promise<void> => {
  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT,
      user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS dictionaries (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_dictionaries_type_user ON dictionaries(type, user_id)
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS dictionary_types (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      label TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      user_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      priority TEXT DEFAULT 'medium',
      due_date DATETIME,
      category_id TEXT,
      user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS todo_tags (
      todo_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (todo_id, tag_id),
      FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      url TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      todo_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  try {
    const tableInfo = db.exec("PRAGMA table_info(attachments)");
    if (tableInfo.length > 0) {
      const columns = tableInfo[0].values.map((col) => col[1] as string);

      if (!columns.includes("entity_type")) {
        db.run("ALTER TABLE attachments ADD COLUMN entity_type TEXT");
      }
      if (!columns.includes("entity_id")) {
        db.run("ALTER TABLE attachments ADD COLUMN entity_id TEXT");
      }
    }
  } catch {
    console.log("Attachments table migration skipped");
  }

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_attachments_entity ON attachments(entity_type, entity_id)
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS wardrobe (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      purchase_date TEXT NOT NULL,
      image_url TEXT,
      status TEXT DEFAULT 'in_use',
      discard_date TEXT,
      discard_reason TEXT,
      description TEXT,
      user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  saveDatabase();
  console.log("Database initialized successfully");
};

export const saveDatabase = (): void => {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
};

const normalizeParams = (params: unknown[]): unknown[] => {
  return params.map((p) => (p === undefined ? null : p));
};

export default {
  run: (sql: string, params: unknown[] = []): void => {
    try {
      db.run(sql, normalizeParams(params));
      saveDatabase();
    } catch (error) {
      console.error("Database run error:", error);
      console.error("SQL:", sql);
      console.error("Params:", params);
      throw error;
    }
  },
  get: <T>(sql: string, params: unknown[] = []): T | undefined => {
    try {
      const result = db.exec(sql, normalizeParams(params));
      if (result.length === 0 || result[0].values.length === 0) return undefined;
      const columns = result[0].columns;
      const values = result[0].values[0];
      const obj: Record<string, unknown> = {};
      columns.forEach((col: string, i: number) => {
        obj[col] = values[i];
      });
      return obj as T;
    } catch (error) {
      console.error("Database get error:", error);
      console.error("SQL:", sql);
      console.error("Params:", params);
      throw error;
    }
  },
  all: <T>(sql: string, params: unknown[] = []): T[] => {
    try {
      const result = db.exec(sql, normalizeParams(params));
      if (result.length === 0) return [];
      const columns = result[0].columns;
      return result[0].values.map((values: unknown[]) => {
        const obj: Record<string, unknown> = {};
        columns.forEach((col: string, i: number) => {
          obj[col] = values[i];
        });
        return obj as T;
      });
    } catch (error) {
      console.error("Database all error:", error);
      console.error("SQL:", sql);
      console.error("Params:", params);
      throw error;
    }
  },
};
