export type AccountType = "income" | "expense";

export const INCOME_CATEGORIES = ["工资", "奖金", "投资收益", "兼职", "其他收入"] as const;
export const EXPENSE_CATEGORIES = ["餐饮", "交通", "购物", "娱乐", "居住", "医疗", "教育", "其他支出"] as const;

export type IncomeCategory = typeof INCOME_CATEGORIES[number];
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
export type AccountCategory = IncomeCategory | ExpenseCategory;

export interface Account {
  id: string;
  type: AccountType;
  category: string;
  amount: number;
  description?: string;
  date: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountSummary {
  income: number;
  expense: number;
  balance: number;
}

export interface CreateAccountRequest {
  type: AccountType;
  category: string;
  amount: number;
  description?: string;
  date: string;
}

export interface UpdateAccountRequest {
  type?: AccountType;
  category?: string;
  amount?: number;
  description?: string;
  date?: string;
}

export interface AccountQueryParams {
  page?: number;
  limit?: number;
  type?: AccountType;
  category?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: "date" | "amount" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface CategoryStatistics {
  type: AccountType;
  category: string;
  total: number;
}

export interface MonthlyStatistics {
  month: string;
  type: AccountType;
  total: number;
}

export interface AccountStatistics {
  byCategory: CategoryStatistics[];
  byMonth: MonthlyStatistics[];
}
