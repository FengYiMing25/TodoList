export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  todoId: string;
  createdAt: string;
}

export interface UploadResponse {
  attachment: Attachment;
}
