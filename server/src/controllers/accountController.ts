import { Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { AuthRequest } from "../types";
import db from "../database";
import { asyncHandler } from "../middlewares";

interface AccountRow {
  id: string;
  type: string;
  category: string;
  amount: number;
  description: string | null;
  date: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const getAccounts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 10, type, category, startDate, endDate, sortBy = "date", sortOrder = "desc" } = req.query;

  const sortByMap: Record<string, string> = {
    date: "date",
    amount: "amount",
    createdAt: "created_at",
  };
  const dbSortBy = sortByMap[sortBy as string] || "date";

  let sql = `SELECT * FROM accounts WHERE user_id = ?`;
  const params: unknown[] = [req.userId];

  if (type) {
    sql += " AND type = ?";
    params.push(type);
  }
  if (category) {
    sql += " AND category = ?";
    params.push(category);
  }
  if (startDate) {
    sql += " AND date >= ?";
    params.push(startDate);
  }
  if (endDate) {
    sql += " AND date <= ?";
    params.push(endDate);
  }

  const countSql = sql.replace("SELECT *", "SELECT COUNT(*) as total");
  const countResult = db.get<{ total: number }>(countSql, params);
  const total = countResult?.total || 0;

  sql += ` ORDER BY ${dbSortBy} ${sortOrder === "asc" ? "ASC" : "DESC"} LIMIT ? OFFSET ?`;
  params.push(Number(limit), (Number(page) - 1) * Number(limit));

  const accounts = db.all<AccountRow>(sql, params);

  const incomeSql = `SELECT COALESCE(SUM(amount), 0) as total FROM accounts WHERE user_id = ? AND type = 'income'`;
  const expenseSql = `SELECT COALESCE(SUM(amount), 0) as total FROM accounts WHERE user_id = ? AND type = 'expense'`;
  
  const incomeTotal = db.get<{ total: number }>(incomeSql, [req.userId]);
  const expenseTotal = db.get<{ total: number }>(expenseSql, [req.userId]);

  res.json({
    success: true,
    data: {
      items: accounts.map((a) => ({
        id: a.id,
        type: a.type,
        category: a.category,
        amount: a.amount,
        description: a.description,
        date: a.date,
        userId: a.user_id,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
      })),
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      summary: {
        income: incomeTotal?.total || 0,
        expense: expenseTotal?.total || 0,
        balance: (incomeTotal?.total || 0) - (expenseTotal?.total || 0),
      },
    },
  });
});

export const getAccountById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const account = db.get<AccountRow>(`SELECT * FROM accounts WHERE id = ? AND user_id = ?`, [id, req.userId]);

  if (!account) {
    res.status(404).json({ success: false, message: "记账记录不存在" });
    return;
  }

  res.json({
    success: true,
    data: {
      id: account.id,
      type: account.type,
      category: account.category,
      amount: account.amount,
      description: account.description,
      date: account.date,
      userId: account.user_id,
      createdAt: account.created_at,
      updatedAt: account.updated_at,
    },
  });
});

export const createAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { type, category, amount, description, date } = req.body;

  if (!type || !category || !amount || !date) {
    res.status(400).json({ success: false, message: "类型、分类、金额和日期不能为空" });
    return;
  }

  if (type !== "income" && type !== "expense") {
    res.status(400).json({ success: false, message: "类型必须是 income 或 expense" });
    return;
  }

  const accountId = uuidv4();

  db.run(`INSERT INTO accounts (id, type, category, amount, description, date, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`, [
    accountId,
    type,
    category,
    amount,
    description,
    date,
    req.userId,
  ]);

  const account = db.get<AccountRow>("SELECT * FROM accounts WHERE id = ?", [accountId]);

  res.status(201).json({
    success: true,
    data: {
      id: account?.id,
      type: account?.type,
      category: account?.category,
      amount: account?.amount,
      description: account?.description,
      date: account?.date,
      userId: account?.user_id,
      createdAt: account?.created_at,
      updatedAt: account?.updated_at,
    },
  });
});

export const updateAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { type, category, amount, description, date } = req.body;

  const existingAccount = db.get<AccountRow>("SELECT * FROM accounts WHERE id = ? AND user_id = ?", [id, req.userId]);

  if (!existingAccount) {
    res.status(404).json({ success: false, message: "记账记录不存在" });
    return;
  }

  if (type && type !== "income" && type !== "expense") {
    res.status(400).json({ success: false, message: "类型必须是 income 或 expense" });
    return;
  }

  db.run(
    `UPDATE accounts SET type = COALESCE(?, type), category = COALESCE(?, category), amount = COALESCE(?, amount), description = COALESCE(?, description), date = COALESCE(?, date), updated_at = datetime('now') WHERE id = ?`,
    [type, category, amount, description, date, id],
  );

  const account = db.get<AccountRow>("SELECT * FROM accounts WHERE id = ?", [id]);

  res.json({
    success: true,
    data: {
      id: account?.id,
      type: account?.type,
      category: account?.category,
      amount: account?.amount,
      description: account?.description,
      date: account?.date,
      userId: account?.user_id,
      createdAt: account?.created_at,
      updatedAt: account?.updated_at,
    },
  });
});

export const deleteAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const account = db.get<AccountRow>("SELECT * FROM accounts WHERE id = ? AND user_id = ?", [id, req.userId]);

  if (!account) {
    res.status(404).json({ success: false, message: "记账记录不存在" });
    return;
  }

  db.run("DELETE FROM accounts WHERE id = ?", [id]);

  res.json({ success: true, message: "删除成功" });
});

export const getStatistics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { startDate, endDate } = req.query;

  let dateFilter = "";
  const params: unknown[] = [req.userId];

  if (startDate && endDate) {
    dateFilter = " AND date BETWEEN ? AND ?";
    params.push(startDate, endDate);
  }

  const categorySql = `
    SELECT type, category, SUM(amount) as total 
    FROM accounts 
    WHERE user_id = ? ${dateFilter}
    GROUP BY type, category 
    ORDER BY type, total DESC
  `;

  const categoryStats = db.all<{ type: string; category: string; total: number }>(categorySql, params);

  const monthlySql = `
    SELECT strftime('%Y-%m', date) as month, type, SUM(amount) as total
    FROM accounts
    WHERE user_id = ? ${dateFilter}
    GROUP BY strftime('%Y-%m', date), type
    ORDER BY month DESC
  `;

  const monthlyStats = db.all<{ month: string; type: string; total: number }>(monthlySql, params);

  res.json({
    success: true,
    data: {
      byCategory: categoryStats,
      byMonth: monthlyStats,
    },
  });
});
