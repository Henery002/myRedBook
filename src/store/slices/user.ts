import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import Taro from "@tarojs/taro";
import type { UserState, UserInfo, LoginParams } from "../types";
import { getDB } from "@/services/cloud";
import { encryptPassword } from "@/utils/crypto";

import AVATAR_IMG from "@/assets/images/avatar.jpeg";

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
          const now = db.serverDate();
          const { _id } = await db.collection("users").add({
            data: {
              // 基础信息
              phone: params.phone,
              password: encryptedPassword, // 加密密码
              nickname: `用户${params.phone.substr(-4)}`, // 默认昵称
              avatarUrl: AVATAR_IMG, // 默认头像
              bio: "", // 默认简介
              gender: 0, // 默认性别

              // 地理位置信息
              country: "",
              province: "",
              city: "",
              district: "",
              ip: "",

              // 统计数据
              followingCount: 0,
              followersCount: 0,
              notesCount: 0,
              likesCount: 0,
              collectionsCount: 0,

              // 用户内容
              notes: [],
              likedNotes: [],
              collectedNotes: [],
              following: [],
              followers: [],

              // 账号状态
              status: "active",
              isVerified: false,
              role: "user",

              // 时间信息
              createTime: now,
              updateTime: now,
              lastLoginTime: now,

              // 其他设置
              settings: {
                notificationEnabled: true,
                privacyLevel: "public",
                theme: "light",
                language: "zh",
              },
            },
          });

          userInfo = {
            _id: _id as string,
            phone: params.phone,
            nickname: `用户${params.phone.substr(-4)}`,
            avatarUrl: AVATAR_IMG,
            bio: "",
            gender: 0,
            followingCount: 0,
            followersCount: 0,
            notesCount: 0,
            likesCount: 0,
            collectionsCount: 0,
            notes: [],
            likedNotes: [],
            collectedNotes: [],
            following: [],
            followers: [],
            status: "active",
            isVerified: false,
            role: "user",
            createTime: new Date(),
            updateTime: new Date(),
            lastLoginTime: new Date(),
            settings: {
              notificationEnabled: true,
              privacyLevel: "public",
              theme: "light",
              language: "zh",
            },
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

          // 更新最后登录时间
          await db
            .collection("users")
            .doc(existingUser._id as string)
            .update({
              data: {
                lastLoginTime: db.serverDate(),
                updateTime: db.serverDate(),
              },
            });

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
