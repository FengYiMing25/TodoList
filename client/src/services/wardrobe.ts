import api from "./api";
import type {
  WardrobeItem,
  CreateWardrobeRequest,
  UpdateWardrobeRequest,
  DiscardWardrobeRequest,
  WardrobeQueryParams,
  WardrobeStatistics,
  PaginatedResponse,
} from "@types";

interface WardrobeListResponse extends PaginatedResponse<WardrobeItem> {}

export const wardrobeApi = {
  getItems: (params?: WardrobeQueryParams): Promise<WardrobeListResponse> =>
    api.get("/wardrobe", { params }),

  getItemById: (id: string): Promise<WardrobeItem> =>
    api.get(`/wardrobe/${id}`),

  createItem: (data: CreateWardrobeRequest): Promise<WardrobeItem> =>
    api.post("/wardrobe", data),

  updateItem: (id: string, data: UpdateWardrobeRequest): Promise<WardrobeItem> =>
    api.put(`/wardrobe/${id}`, data),

  discardItem: (id: string, data: DiscardWardrobeRequest): Promise<WardrobeItem> =>
    api.post(`/wardrobe/${id}/discard`, data),

  deleteItem: (id: string): Promise<void> =>
    api.delete(`/wardrobe/${id}`),

  getStatistics: (): Promise<WardrobeStatistics> =>
    api.get("/wardrobe/statistics"),
};
