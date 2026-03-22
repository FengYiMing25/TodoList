import { FastifyRequest, FastifyReply } from "fastify";
import { v4 as uuidv4 } from "uuid";
import db from "../database";
import type {
  Account,
  CreateAccountRequest,
  UpdateAccountRequest,
  AccountQueryParams,
  AccountStatistics,
  CategoryStatistics,
  MonthlyStatistics,
} from "@shared/types";

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

const formatAccount = (a: AccountRow): Account => ({
  id: a.id,
  type: a.type as Account["type"],
  category: a.category,
  amount: a.amount,
  description: a.description || undefined,
  date: a.date,
  userId: a.user_id,
  createdAt: a.created_at,
  updatedAt: a.updated_at,
});

export const getAccounts = async (
  request: FastifyRequest<{ Querystring: AccountQueryParams }>,
  reply: FastifyReply
) => {
  const {
    page = 1,
    limit = 10,
    type,
    category,
    startDate,
    endDate,
    sortBy = "date",
    sortOrder = "desc",
  } = request.query;

  const sortByMap: Record<string, string> = {
    date: "date",
    amount: "amount",
    createdAt: "created_at",
  };
  const dbSortBy = sortByMap[sortBy] || "date";

  let sql = `SELECT * FROM accounts WHERE user_id = ?`;
  const params: unknown[] = [request.userId];

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

  const incomeTotal = db.get<{ total: number }>(incomeSql, [request.userId]);
  const expenseTotal = db.get<{ total: number }>(expenseSql, [request.userId]);

  return reply.send({
    success: true,
    data: {
      items: accounts.map(formatAccount),
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
};

export const getAccountById = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const { id } = request.params;

  const account = db.get<AccountRow>(
    `SELECT * FROM accounts WHERE id = ? AND user_id = ?`,
    [id, request.userId]
  );

  if (!account) {
    return reply.code(404).send({ success: false, message: "记账记录不存在" });
  }

  return reply.send({
    success: true,
    data: formatAccount(account),
  });
};

export const createAccount = async (
  request: FastifyRequest<{ Body: CreateAccountRequest }>,
  reply: FastifyReply
) => {
  const { type, category, amount, description, date } = request.body;

  if (!type || !category || !amount || !date) {
    return reply.code(400).send({ success: false, message: "类型、分类、金额和日期不能为空" });
  }

  if (type !== "income" && type !== "expense") {
    return reply.code(400).send({ success: false, message: "类型必须是 income 或 expense" });
  }

  const accountId = uuidv4();

  db.run(
    `INSERT INTO accounts (id, type, category, amount, description, date, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [accountId, type, category, amount, description, date, request.userId]
  );

  const account = db.get<AccountRow>("SELECT * FROM accounts WHERE id = ?", [accountId]);

  return reply.code(201).send({
    success: true,
    data: formatAccount(account!),
  });
};

export const updateAccount = async (
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateAccountRequest }>,
  reply: FastifyReply
) => {
  const { id } = request.params;
  const { type, category, amount, description, date } = request.body;

  const existingAccount = db.get<AccountRow>(
    "SELECT * FROM accounts WHERE id = ? AND user_id = ?",
    [id, request.userId]
  );

  if (!existingAccount) {
    return reply.code(404).send({ success: false, message: "记账记录不存在" });
  }

  if (type && type !== "income" && type !== "expense") {
    return reply.code(400).send({ success: false, message: "类型必须是 income 或 expense" });
  }

  db.run(
    `UPDATE accounts SET type = COALESCE(?, type), category = COALESCE(?, category), amount = COALESCE(?, amount), description = COALESCE(?, description), date = COALESCE(?, date), updated_at = datetime('now') WHERE id = ?`,
    [type, category, amount, description, date, id]
  );

  const account = db.get<AccountRow>("SELECT * FROM accounts WHERE id = ?", [id]);

  return reply.send({
    success: true,
    data: formatAccount(account!),
  });
};

export const deleteAccount = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const { id } = request.params;

  const account = db.get<AccountRow>(
    "SELECT * FROM accounts WHERE id = ? AND user_id = ?",
    [id, request.userId]
  );

  if (!account) {
    return reply.code(404).send({ success: false, message: "记账记录不存在" });
  }

  db.run("DELETE FROM accounts WHERE id = ?", [id]);

  return reply.send({ success: true, message: "删除成功" });
};

export const getStatistics = async (
  request: FastifyRequest<{ Querystring: { startDate?: string; endDate?: string } }>,
  reply: FastifyReply
) => {
  const { startDate, endDate } = request.query;

  let dateFilter = "";
  const params: unknown[] = [request.userId];

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

  const categoryStats = db.all<CategoryStatistics>(categorySql, params);

  const monthlySql = `
    SELECT strftime('%Y-%m', date) as month, type, SUM(amount) as total
    FROM accounts
    WHERE user_id = ? ${dateFilter}
    GROUP BY strftime('%Y-%m', date), type
    ORDER BY month DESC
  `;

  const monthlyStats = db.all<MonthlyStatistics>(monthlySql, params);

  return reply.send({
    success: true,
    data: {
      byCategory: categoryStats,
      byMonth: monthlyStats,
    } as AccountStatistics,
  });
};
