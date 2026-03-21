import api from "./api";
import type { Account, CreateAccountRequest, UpdateAccountRequest, AccountQueryParams, PaginatedResponse, AccountStatistics, AccountSummary } from "@types";

interface AccountListResponse extends PaginatedResponse<Account> {
  summary: AccountSummary;
}

export const accountApi = {
  getAccounts: (params?: AccountQueryParams): Promise<AccountListResponse> => api.get("/accounts", { params }),

  getAccountById: (id: string): Promise<Account> => api.get(`/accounts/${id}`),

  createAccount: (data: CreateAccountRequest): Promise<Account> => api.post("/accounts", data),

  updateAccount: (id: string, data: UpdateAccountRequest): Promise<Account> => api.put(`/accounts/${id}`, data),

  deleteAccount: (id: string): Promise<void> => api.delete(`/accounts/${id}`),

  getStatistics: (params?: { startDate?: string; endDate?: string }): Promise<AccountStatistics> => api.get("/accounts/statistics", { params }),
};
