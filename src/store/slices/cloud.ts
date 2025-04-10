import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { CloudState } from "../types";
import { initCloud } from "@/services/cloud";

export const useCloudStore = create<CloudState>()(
  immer((set) => ({
    initialized: false,
    error: null,

    initializeCloud: async () => {
      try {
        await initCloud();
        set((state) => {
          state.initialized = true;
          state.error = null;
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error ? error.message : "云开发初始化失败";
        });
      }
    },

    resetError: () => {
      set((state) => {
        state.error = null;
      });
    },
  })),
);
