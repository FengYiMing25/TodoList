import api from "./api";
import type { UploadResponse } from "@types";

interface UploadOptions {
  todoId?: string;
  entityType?: "wardrobe" | "user" | "todo";
  entityId?: string;
}

const uploadWithRetry = async (
  formData: FormData,
  retries = 3
): Promise<UploadResponse> => {
  let lastError: Error | null = null;

  for (let i = 0; i < retries; i++) {
    try {
      return await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("上传失败");
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  throw lastError;
};

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

    return uploadWithRetry(formData);
  },

  deleteFile: (id: string): Promise<void> => api.delete(`/upload/${id}`),

  deleteByEntity: (entityType: string, entityId: string): Promise<void> =>
    api.delete(`/upload/entity/${entityType}/${entityId}`),
};
