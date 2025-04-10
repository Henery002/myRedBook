import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import Taro from "@tarojs/taro";
import type { UserState, UserInfo, LoginParams } from "../types";
import { getDB } from "@/services/cloud";

export const useUserStore = create<UserState>()(
  immer((set, get) => ({
    userInfo: null,
    isLogin: false,
    loading: false,

    setUserInfo: (userInfo: UserInfo) => {
      set((state) => {
        state.userInfo = userInfo;
        state.isLogin = true;
      });
    },

    checkLoginStatus: async () => {
      try {
        // 获取云开发数据库实例
        const db = getDB();

        // 直接查询当前用户的数据（云开发会自动匹配 _openid）
        const { data } = await db.collection("users").where({}).get();

        if (data.length > 0) {
          const userInfo = data[0] as UserInfo;
          set((state) => {
            state.userInfo = userInfo;
            state.isLogin = true;
          });
          return true;
        }

        return false;
      } catch (error) {
        console.error("检查登录状态失败:", error);
        return false;
      }
    },

    login: async (params: LoginParams) => {
      try {
        set((state) => {
          state.loading = true;
        });

        // 获取微信登录凭证
        await Taro.login(); // 确保登录态有效

        // 获取云开发数据库实例
        const db = getDB();

        // 查询用户是否已存在
        const { data } = await db
          .collection("users")
          .where({
            phone: params.phone,
          })
          .get();

        let userInfo: UserInfo;

        if (data.length === 0) {
          // 新用户，插入数据库
          // 注意：不需要手动设置 _openid，云开发会自动设置
          const { _id } = await db.collection("users").add({
            data: {
              phone: params.phone,
              password: params.password, // 实际项目中应该加密存储
              // _openid: openid,
              createTime: db.serverDate(),
            },
          });

          userInfo = {
            _id: _id as string,
            phone: params.phone,
            password: params.password,
          };
        } else {
          // 已存在的用户，验证密码
          const existingUser = data[0] as UserInfo;
          if (existingUser.password !== params.password) {
            Taro.showToast({
              title: "密码错误",
              icon: "none",
            });
            throw new Error("密码错误");
          }
          userInfo = existingUser;
        }

        console.log(data, userInfo, "login-userinfo...");

        set((state) => {
          state.userInfo = userInfo;
          state.isLogin = true;
          state.loading = false;
        });

        Taro.showToast({
          title: "登录成功",
          icon: "success",
        });
      } catch (error) {
        Taro.showToast({
          title: "登录失败",
          icon: "none",
        });
        console.error("登录失败:", error);
        set((state) => {
          state.loading = false;
        });
      }
    },

    logout: () => {
      set((state) => {
        state.userInfo = null;
        state.isLogin = false;
      });
    },
  })),
);
