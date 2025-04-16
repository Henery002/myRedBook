import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import Taro from "@tarojs/taro";
import type { UserState, UserInfo, LoginParams } from "../types";
import { getDB } from "@/services/cloud";
import { encryptPassword } from "@/utils/crypto";

// 持久化存储的key
const STORAGE_KEY = "USER_INFO";

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
      // 持久化存储用户信息
      Taro.setStorageSync(STORAGE_KEY, userInfo);
    },

    // 检查登录状态
    checkLoginStatus: async () => {
      try {
        // 1. 先检查本地存储
        const cachedUserInfo = Taro.getStorageSync(STORAGE_KEY);
        if (!cachedUserInfo) {
          return false;
        }

        // 2. 获取云开发数据库实例
        const db = getDB();

        // 3. 查询当前用户信息（使用 phone 字段查询，云开发会自动匹配 _openid）
        const { data } = await db
          .collection("users")
          .where({
            phone: cachedUserInfo.phone,
            // _id: cachedUserInfo._id, // _id好像是云开发自动生成的，每次重新登陆都会改变，所以不能用
          })
          .get();

        // console.log(data, cachedUserInfo, "checkLoginStatus...");

        if (data.length > 0) {
          const userInfo = data[0] as UserInfo;
          set((state) => {
            state.userInfo = userInfo;
            state.isLogin = true;
          });
          return true;
        }

        // 如果数据库中找不到用户，清除本地存储
        Taro.removeStorageSync(STORAGE_KEY);
        return false;
      } catch (error) {
        console.error("检查登录状态失败:", error);
        return false;
      }
    },

    // 登录
    login: async (params: LoginParams) => {
      try {
        set((state) => {
          state.loading = true;
        });

        // 1. 确保微信登录态有效(微信登录态有效期为7天)
        await Taro.login();

        // 2. 获取云开发数据库实例
        const db = getDB();

        // 3. 加密密码
        const encryptedPassword = encryptPassword(params.password);

        // 4. 查询用户是否已存在
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
              password: encryptedPassword, // 加密密码
              createTime: db.serverDate(), // 创建时间
              updateTime: db.serverDate(), // 更新时间
            },
          });

          userInfo = {
            _id: _id as string,
            phone: params.phone,
            // password: params.password,
            createTime: new Date(),
          };
        } else {
          // 已存在的用户，验证密码
          const existingUser = data[0] as UserInfo;

          if (existingUser.password !== encryptedPassword) {
            Taro.showToast({
              title: "密码错误",
              icon: "error",
            });
            set((state) => {
              state.isLogin = false;
              state.loading = false;
            });
            return false; // 返回 false 表示登录失败
          }
          userInfo = existingUser;
        }

        // 5. 更新状态并持久化存储
        set((state) => {
          state.userInfo = userInfo;
          state.isLogin = true;
          state.loading = false;
        });
        Taro.setStorageSync(STORAGE_KEY, userInfo);

        return true; // 返回 true 表示登录成功
      } catch (error) {
        console.error("登录失败:", error);
        set((state) => {
          state.loading = false;
        });

        Taro.showToast({
          title: "登录失败",
          icon: "none",
        });
        return false; // 返回 false 表示登录失败
      }
    },

    // 登出
    logout: () => {
      set((state) => {
        state.userInfo = null;
        state.isLogin = false;
      });
      // 清除持久化存储
      Taro.removeStorageSync(STORAGE_KEY);
    },
  })),
);
