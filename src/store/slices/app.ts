import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { AppState } from "../types";
import Taro from "@tarojs/taro";

export const useAppStore = create<AppState>()(
  immer((set) => ({
    theme: "light",
    language: "zh",

    setTheme: (theme: "light" | "dark") => {
      set((state) => {
        state.theme = theme;
      });
      // 持久化主题设置
      Taro.setStorageSync("theme", theme);
    },

    setLanguage: (lang: "zh" | "en") => {
      set((state) => {
        state.language = lang;
      });
      // 持久化语言设置
      Taro.setStorageSync("language", lang);
    },
  })),
);
