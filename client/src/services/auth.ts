import api from "./api";
import type { User, LoginRequest, RegisterRequest, AuthResponse } from "@types";

export const authApi = {
  login: (data: LoginRequest): Promise<AuthResponse> => api.post("/auth/login", data),

  register: (data: RegisterRequest): Promise<AuthResponse> => api.post("/auth/register", data),

  getProfile: (): Promise<User> => api.get("/auth/profile"),

  updateProfile: (data: Partial<User>): Promise<User> => api.put("/auth/profile", data),

  changePassword: (oldPassword: string, newPassword: string): Promise<void> => api.put("/auth/password", { oldPassword, newPassword }),
};
