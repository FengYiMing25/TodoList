import { create } from "zustand";
import type { WardrobeItem, WardrobeStatistics, CreateWardrobeRequest, UpdateWardrobeRequest, DiscardWardrobeRequest, WardrobeQueryParams } from "@types";
import { wardrobeApi } from "@services/wardrobe";
import { dedupeRequest, createDedupeKey } from "@utils/requestDedupe";

interface WardrobeState {
  items: WardrobeItem[];
  statistics: WardrobeStatistics | null;
  isLoading: boolean;
  total: number;
  page: number;
  limit: number;
  filters: WardrobeQueryParams;
  fetchItems: (params?: WardrobeQueryParams) => Promise<void>;
  fetchStatistics: () => Promise<void>;
  createItem: (data: CreateWardrobeRequest) => Promise<WardrobeItem>;
  updateItem: (id: string, data: UpdateWardrobeRequest) => Promise<void>;
  discardItem: (id: string, data: DiscardWardrobeRequest) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  setFilters: (filters: Partial<WardrobeQueryParams>) => void;
  setPage: (page: number) => void;
}

export const useWardrobeStore = create<WardrobeState>((set, get) => ({
  items: [],
  statistics: null,
  isLoading: false,
  total: 0,
  page: 1,
  limit: 10,
  filters: {},

  fetchItems: async (params?: WardrobeQueryParams) => {
    const { page, limit, filters } = get();
    const queryParams = {
      page: params?.page ?? page,
      limit: params?.limit ?? limit,
      ...filters,
      ...params,
    };
    const key = createDedupeKey("wardrobe", queryParams.page, queryParams.limit, queryParams.category, queryParams.status);
    return dedupeRequest(key, async () => {
      set({ isLoading: true });
      try {
        const response = await wardrobeApi.getItems(queryParams);
        set({
          items: response.items,
          total: response.total,
          page: response.page,
          limit: response.limit,
          isLoading: false,
        });
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    });
  },

  fetchStatistics: async () => {
    const key = createDedupeKey("wardrobe-stats");
    return dedupeRequest(key, async () => {
      const statistics = await wardrobeApi.getStatistics();
      set({ statistics });
    });
  },

  createItem: async (data: CreateWardrobeRequest) => {
    const item = await wardrobeApi.createItem(data);
    const { fetchItems, fetchStatistics } = get();
    await fetchItems();
    await fetchStatistics();
    return item;
  },

  updateItem: async (id: string, data: UpdateWardrobeRequest) => {
    await wardrobeApi.updateItem(id, data);
    const { fetchItems, fetchStatistics } = get();
    await fetchItems();
    await fetchStatistics();
  },

  discardItem: async (id: string, data: DiscardWardrobeRequest) => {
    await wardrobeApi.discardItem(id, data);
    const { fetchItems, fetchStatistics } = get();
    await fetchItems();
    await fetchStatistics();
  },

  deleteItem: async (id: string) => {
    await wardrobeApi.deleteItem(id);
    const { fetchItems, fetchStatistics } = get();
    await fetchItems();
    await fetchStatistics();
  },

  setFilters: (filters: Partial<WardrobeQueryParams>) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
      page: 1,
    }));
  },

  setPage: (page: number) => {
    set({ page });
  },
}));
