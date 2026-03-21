import { create } from "zustand";
import type { Category, Tag, CreateCategoryRequest, UpdateCategoryRequest, CreateTagRequest } from "@types";
import { categoryApi } from "@services/category";

interface CategoryState {
  categories: Category[];
  tags: Tag[];
  isLoading: boolean;
  fetchCategories: () => Promise<void>;
  createCategory: (data: CreateCategoryRequest) => Promise<Category>;
  updateCategory: (id: string, data: UpdateCategoryRequest) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  fetchTags: () => Promise<void>;
  createTag: (data: CreateTagRequest) => Promise<Tag>;
  deleteTag: (id: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set) => ({
  categories: [],
  tags: [],
  isLoading: false,

  fetchCategories: async () => {
    set({ isLoading: true });
    try {
      const categories = await categoryApi.getCategories();
      set({ categories, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createCategory: async (data: CreateCategoryRequest) => {
    const category = await categoryApi.createCategory(data);
    set((state) => ({ categories: [...state.categories, category] }));
    return category;
  },

  updateCategory: async (id: string, data: UpdateCategoryRequest) => {
    const updatedCategory = await categoryApi.updateCategory(id, data);
    set((state) => ({
      categories: state.categories.map((cat) => (cat.id === id ? updatedCategory : cat)),
    }));
  },

  deleteCategory: async (id: string) => {
    await categoryApi.deleteCategory(id);
    set((state) => ({
      categories: state.categories.filter((cat) => cat.id !== id),
    }));
  },

  fetchTags: async () => {
    try {
      const tags = await categoryApi.getTags();
      set({ tags });
    } catch (error) {
      throw error;
    }
  },

  createTag: async (data: CreateTagRequest) => {
    const tag = await categoryApi.createTag(data);
    set((state) => ({ tags: [...state.tags, tag] }));
    return tag;
  },

  deleteTag: async (id: string) => {
    await categoryApi.deleteTag(id);
    set((state) => ({
      tags: state.tags.filter((tag) => tag.id !== id),
    }));
  },
}));
