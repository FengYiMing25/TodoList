import type { Dictionary } from "./dictionary";
import type { Attachment } from "./attachment";

export type Priority = "low" | "medium" | "high";
export type TodoStatus = "pending" | "in_progress" | "completed";

export interface Todo {
  id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  priority: Priority;
  dueDate?: string;
  categoryId?: string;
  category?: Pick<Dictionary, 'id' | 'name' | 'color'>;
  tags: Pick<Dictionary, 'id' | 'name' | 'color'>[];
  attachments?: Attachment[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoRequest {
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: string;
  categoryId?: string;
  tagIds?: string[];
}

export interface UpdateTodoRequest {
  title?: string;
  description?: string;
  status?: TodoStatus;
  priority?: Priority;
  dueDate?: string;
  categoryId?: string;
  tagIds?: string[];
}

export interface TodoQueryParams {
  page?: number;
  limit?: number;
  status?: TodoStatus;
  priority?: Priority;
  categoryId?: string;
  tagId?: string;
  keyword?: string;
  sortBy?: "createdAt" | "dueDate" | "priority";
  sortOrder?: "asc" | "desc";
}
