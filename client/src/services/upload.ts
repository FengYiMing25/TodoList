import api from "./api";
import type { UploadResponse } from "@types";

interface UploadOptions {
  todoId?: string;
  entityType?: "wardrobe" | "user" | "todo";
  entityId?: string;
}

export const uploadApi = {
  uploadFile: async (file: File, options?: UploadOptions): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    if (options?.todoId) {
      formData.append("todoId", options.todoId);
    }
    if (options?.entityType) {
      formData.append("entityType", options.entityType);
    }
    if (options?.entityId) {
      formData.append("entityId", options.entityId);
    }

    return api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  deleteFile: (id: string): Promise<void> => api.delete(`/upload/${id}`),

  deleteByEntity: (entityType: string, entityId: string): Promise<void> => api.delete(`/upload/entity/${entityType}/${entityId}`),
};
