import { Request } from "express";

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: string;
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  categoryId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

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

export interface AuthRequest extends Request {
  userId?: string;
  user?: User;
}
