import { create } from "zustand";
import type { Todo, TodoQueryParams, CreateTodoRequest, UpdateTodoRequest } from "@types";
import { todoApi } from "@services/todo";

interface TodoState {
  todos: Todo[];
  currentTodo: Todo | null;
  isLoading: boolean;
  total: number;
  queryParams: TodoQueryParams;
  fetchTodos: (params?: TodoQueryParams) => Promise<void>;
  fetchTodoById: (id: string) => Promise<void>;
  createTodo: (data: CreateTodoRequest) => Promise<Todo>;
  updateTodo: (id: string, data: UpdateTodoRequest) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  toggleTodoStatus: (id: string) => Promise<void>;
  setQueryParams: (params: Partial<TodoQueryParams>) => void;
  clearCurrentTodo: () => void;
}

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],
  currentTodo: null,
  isLoading: false,
  total: 0,
  queryParams: {
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  },

  fetchTodos: async (params?: TodoQueryParams) => {
    set({ isLoading: true });
    try {
      const queryParams = { ...get().queryParams, ...params };
      const response = await todoApi.getTodos(queryParams);
      set({
        todos: response.items,
        total: response.total,
        queryParams,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchTodoById: async (id: string) => {
    set({ isLoading: true });
    try {
      const todo = await todoApi.getTodoById(id);
      set({ currentTodo: todo, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createTodo: async (data: CreateTodoRequest) => {
    const todo = await todoApi.createTodo(data);
    set((state) => ({ todos: [todo, ...state.todos], total: state.total + 1 }));
    return todo;
  },

  updateTodo: async (id: string, data: UpdateTodoRequest) => {
    const updatedTodo = await todoApi.updateTodo(id, data);
    set((state) => ({
      todos: state.todos.map((todo) => (todo.id === id ? updatedTodo : todo)),
      currentTodo: state.currentTodo?.id === id ? updatedTodo : state.currentTodo,
    }));
  },

  deleteTodo: async (id: string) => {
    await todoApi.deleteTodo(id);
    set((state) => ({
      todos: state.todos.filter((todo) => todo.id !== id),
      total: state.total - 1,
      currentTodo: state.currentTodo?.id === id ? null : state.currentTodo,
    }));
  },

  toggleTodoStatus: async (id: string) => {
    const todo = get().todos.find((t) => t.id === id);
    if (!todo) return;

    const newStatus = todo.status === "completed" ? "pending" : "completed";
    await get().updateTodo(id, { status: newStatus });
  },

  setQueryParams: (params: Partial<TodoQueryParams>) => {
    set((state) => ({ queryParams: { ...state.queryParams, ...params } }));
  },

  clearCurrentTodo: () => {
    set({ currentTodo: null });
  },
}));
