import api from "./api";
import type { Todo, CreateTodoRequest, UpdateTodoRequest, TodoQueryParams, PaginatedResponse } from "@types";

export const todoApi = {
  getTodos: (params?: TodoQueryParams): Promise<PaginatedResponse<Todo>> => api.get("/todos", { params }),

  getTodoById: (id: string): Promise<Todo> => api.get(`/todos/${id}`),

  createTodo: (data: CreateTodoRequest): Promise<Todo> => api.post("/todos", data),

  updateTodo: (id: string, data: UpdateTodoRequest): Promise<Todo> => api.put(`/todos/${id}`, data),

  deleteTodo: (id: string): Promise<void> => api.delete(`/todos/${id}`),

  exportTodos: (format: "json" | "csv" | "excel", params?: TodoQueryParams): Promise<Blob> => api.get(`/todos/export/${format}`, { params, responseType: "blob" }),
};
