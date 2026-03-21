import { create } from "zustand";
import type { Account, AccountQueryParams, CreateAccountRequest, UpdateAccountRequest, AccountSummary, AccountStatistics } from "@types";
import { accountApi } from "@services/account";

interface AccountState {
  accounts: Account[];
  currentAccount: Account | null;
  isLoading: boolean;
  total: number;
  summary: AccountSummary;
  statistics: AccountStatistics | null;
  queryParams: AccountQueryParams;
  fetchAccounts: (params?: AccountQueryParams) => Promise<void>;
  fetchAccountById: (id: string) => Promise<void>;
  createAccount: (data: CreateAccountRequest) => Promise<Account>;
  updateAccount: (id: string, data: UpdateAccountRequest) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  fetchStatistics: (params?: { startDate?: string; endDate?: string }) => Promise<void>;
  setQueryParams: (params: Partial<AccountQueryParams>) => void;
  clearCurrentAccount: () => void;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  currentAccount: null,
  isLoading: false,
  total: 0,
  summary: { income: 0, expense: 0, balance: 0 },
  statistics: null,
  queryParams: {
    page: 1,
    limit: 10,
    sortBy: "date",
    sortOrder: "desc",
  },

  fetchAccounts: async (params?: AccountQueryParams) => {
    set({ isLoading: true });
    try {
      const queryParams = { ...get().queryParams, ...params };
      const response = await accountApi.getAccounts(queryParams);
      set({
        accounts: response.items,
        total: response.total,
        summary: response.summary,
        queryParams,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchAccountById: async (id: string) => {
    set({ isLoading: true });
    try {
      const account = await accountApi.getAccountById(id);
      set({ currentAccount: account, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createAccount: async (data: CreateAccountRequest) => {
    const account = await accountApi.createAccount(data);
    set((state) => ({ accounts: [account, ...state.accounts], total: state.total + 1 }));
    return account;
  },

  updateAccount: async (id: string, data: UpdateAccountRequest) => {
    const updatedAccount = await accountApi.updateAccount(id, data);
    set((state) => ({
      accounts: state.accounts.map((account) => (account.id === id ? updatedAccount : account)),
      currentAccount: state.currentAccount?.id === id ? updatedAccount : state.currentAccount,
    }));
  },

  deleteAccount: async (id: string) => {
    await accountApi.deleteAccount(id);
    set((state) => ({
      accounts: state.accounts.filter((account) => account.id !== id),
      total: state.total - 1,
      currentAccount: state.currentAccount?.id === id ? null : state.currentAccount,
    }));
  },

  fetchStatistics: async (params?: { startDate?: string; endDate?: string }) => {
    try {
      const statistics = await accountApi.getStatistics(params);
      set({ statistics });
    } catch (error) {
      throw error;
    }
  },

  setQueryParams: (params: Partial<AccountQueryParams>) => {
    set((state) => ({ queryParams: { ...state.queryParams, ...params } }));
  },

  clearCurrentAccount: () => {
    set({ currentAccount: null });
  },
}));
