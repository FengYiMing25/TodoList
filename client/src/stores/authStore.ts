import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, AuthResponse } from "@types";
import { authApi } from "@services/auth";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  checkAuth: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,

      login: async (username: string, password: string) => {
        set({ isLoading: true });
        try {
          const response: AuthResponse = await authApi.login({ username, password });
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (username: string, email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response: AuthResponse = await authApi.register({ username, email, password });
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: User) => {
        set({ user });
      },

      checkAuth: async () => {
        const { token, isInitialized } = get();
        
        if (!token) {
          set({ isInitialized: true, isAuthenticated: false });
          return;
        }

        if (isInitialized) return;

        set({ isLoading: true });
        try {
          const user = await authApi.getProfile();
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false, 
            isInitialized: true 
          });
        } catch {
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false, 
            isLoading: false,
            isInitialized: true,
          });
        }
      },

      updateProfile: async (data: Partial<User>) => {
        set({ isLoading: true });
        try {
          const user = await authApi.updateProfile(data);
          set({ user, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ token: state.token }),
    },
  ),
);
