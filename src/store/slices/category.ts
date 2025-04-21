import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import Taro from "@tarojs/taro";
import type { CategoryState, Category } from "../types";
import { getDB } from "@/services/cloud";

export const useCategoryStore = create<CategoryState>()(
  immer((set) => ({
    categories: [],
    loading: false,
    error: null,

    fetchCategories: async () => {
      try {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        const db = getDB();
        // 获取分类列表
        const { data } = await db
          .collection("categories")
          .orderBy("_id", "asc")
          .get();

        // 确保数据符合 Category 类型
        const categories: Category[] = data.map((item: any) => ({
          _id: item._id,
          name: item.name || "默认分类",
        }));

        set((state) => {
          state.categories = categories;
          state.loading = false;
        });
      } catch (error) {
        console.error("获取分类列表失败:", error);
        set((state) => {
          state.loading = false;
          state.error = "获取分类列表失败";
        });
        Taro.showToast({
          title: "获取分类列表失败",
          icon: "none",
        });
      }
    },
  })),
);
