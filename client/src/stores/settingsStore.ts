import { create } from "zustand";
import { persist } from "zustand/middleware";

type ThemeMode = "light" | "dark" | "system";

interface SettingsState {
  themeMode: ThemeMode;
  primaryColor: string;
  fontSize: number;
  sidebarCollapsed: boolean;
  showCompleted: boolean;
  defaultPriority: "low" | "medium" | "high";
  setThemeMode: (mode: ThemeMode) => void;
  setPrimaryColor: (color: string) => void;
  setFontSize: (size: number) => void;
  toggleSidebar: () => void;
  setShowCompleted: (show: boolean) => void;
  setDefaultPriority: (priority: "low" | "medium" | "high") => void;
  resetSettings: () => void;
}

const defaultSettings = {
  themeMode: "light" as ThemeMode,
  primaryColor: "#1890ff",
  fontSize: 14,
  sidebarCollapsed: false,
  showCompleted: true,
  defaultPriority: "medium" as const,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setThemeMode: (mode: ThemeMode) => set({ themeMode: mode }),
      setPrimaryColor: (color: string) => set({ primaryColor: color }),
      setFontSize: (size: number) => set({ fontSize: size }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setShowCompleted: (show: boolean) => set({ showCompleted: show }),
      setDefaultPriority: (priority: "low" | "medium" | "high") => set({ defaultPriority: priority }),
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: "settings-storage",
    },
  ),
);
