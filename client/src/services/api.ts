import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@stores/authStore";

const getBaseURL = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return "/api";
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
      return data.data;
    }
    return response.data;
  },
  (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 401) {
      const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register';
      if (!isAuthPage) {
        useAuthStore.getState().logout();
        window.location.href = "/login";
      }
    }
    const message = error.response?.data?.message || error.message || "请求失败";
    return Promise.reject(new Error(message));
  },
);

export default api;
