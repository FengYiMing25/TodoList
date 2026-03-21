import api from "./api";
import type { UploadResponse } from "@types";

export const uploadApi = {
  uploadFile: async (file: File, todoId: string): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("todoId", todoId);
    return api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  deleteFile: (id: string): Promise<void> => api.delete(`/upload/${id}`),
};
