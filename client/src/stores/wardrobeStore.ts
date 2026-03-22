import { create } from "zustand";
import type {
  WardrobeItem,
  WardrobeStatistics,
  CreateWardrobeRequest,
  UpdateWardrobeRequest,
  DiscardWardrobeRequest,
  WardrobeQueryParams,
  WardrobeCategory,
} from "@types";
import { wardrobeApi } from "@services/wardrobe";

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

const WARDROBE_CATEGORIES: WardrobeCategory[] = [
  "厨具",
  "衣服",
  "鞋子",
  "电子产品",
  "家具",
  "书籍",
  "运动器材",
  "其他",
];

export const useWardrobeStore = create<WardrobeState>((set, get) => ({
  items: [],
  statistics: null,
  isLoading: false,
  total: 0,
  page: 1,
  limit: 10,
  filters: {},

  fetchItems: async (params?: WardrobeQueryParams) => {
    set({ isLoading: true });
    try {
      const { page, limit, filters } = get();
      const response = await wardrobeApi.getItems({
        page: params?.page ?? page,
        limit: params?.limit ?? limit,
        ...filters,
        ...params,
      });
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
  },

  fetchStatistics: async () => {
    try {
      const statistics = await wardrobeApi.getStatistics();
      set({ statistics });
    } catch (error) {
      console.error("Failed to fetch statistics:", error);
    }
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

export { WARDROBE_CATEGORIES };
