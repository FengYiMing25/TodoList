import api from "./api";
import type { Category, Tag, CreateCategoryRequest, UpdateCategoryRequest, CreateTagRequest } from "@types";

export const categoryApi = {
  getCategories: (): Promise<Category[]> => api.get("/categories"),

  createCategory: (data: CreateCategoryRequest): Promise<Category> => api.post("/categories", data),

  updateCategory: (id: string, data: UpdateCategoryRequest): Promise<Category> => api.put(`/categories/${id}`, data),

  deleteCategory: (id: string): Promise<void> => api.delete(`/categories/${id}`),

  getTags: (): Promise<Tag[]> => api.get("/tags"),

  createTag: (data: CreateTagRequest): Promise<Tag> => api.post("/tags", data),

  deleteTag: (id: string): Promise<void> => api.delete(`/tags/${id}`),
};
