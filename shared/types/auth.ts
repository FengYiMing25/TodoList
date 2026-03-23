export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  monthSalary?: number;
  dailyExpense?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface UpdateProfileRequest {
  username?: string;
  email?: string;
  avatar?: string;
  monthSalary?: number;
  dailyExpense?: number;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}
