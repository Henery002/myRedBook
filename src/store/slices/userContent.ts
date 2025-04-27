import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import Taro from "@tarojs/taro";
import { getDB } from "@/services/cloud";
import { Note } from "../types";

interface UserContentState {
  // 用户发布的笔记
  userNotes: Note[];
  // 用户收藏的笔记
  collectedNotes: Note[];
  // 用户点赞的笔记
  likedNotes: Note[];
  // 用户获赞数
  receivedLikes: number;
  // 用户获收藏数
  receivedCollections: number;
  // 加载状态
  loading: {
    notes: boolean;
    collected: boolean;
    liked: boolean;
    stats: boolean;
  };
  // 是否有更多数据
  hasMore: {
    notes: boolean;
    collected: boolean;
    liked: boolean;
  };
  // 当前页码
  currentPage: {
    notes: number;
    collected: number;
    liked: number;
  };
  // 每页数量
  pageSize: number;

  // 获取用户发布的笔记
  fetchUserNotes: (refresh?: boolean) => Promise<void>;
  // 获取用户收藏的笔记
  fetchCollectedNotes: (refresh?: boolean) => Promise<void>;
  // 获取用户点赞的笔记
  fetchLikedNotes: (refresh?: boolean) => Promise<void>;
  // 获取用户获赞和收藏数据
  fetchUserStats: () => Promise<void>;
  // 刷新所有数据
  refreshAllData: () => Promise<void>;
  // 重置状态
  resetState: () => void;
}

export const useUserContentStore = create<UserContentState>()(
  immer((set, get) => ({
    userNotes: [],
    collectedNotes: [],
    likedNotes: [],
    receivedLikes: 0,
    receivedCollections: 0,
    loading: {
      notes: false,
      collected: false,
      liked: false,
      stats: false,
    },
    hasMore: {
      notes: true,
      collected: true,
      liked: true,
    },
    currentPage: {
      notes: 1,
      collected: 1,
      liked: 1,
    },
    pageSize: 10,

    fetchUserNotes: async (refresh = false) => {
      const { currentPage, pageSize, userNotes, loading, hasMore } = get();
      const userId = Taro.getStorageSync("USER_INFO")?._id;

      if (!userId) {
        Taro.showToast({
          title: "请先登录",
          icon: "none",
        });
        return;
      }

      if (refresh) {
        set((state) => {
          state.currentPage.notes = 1;
          state.hasMore.notes = true;
          state.userNotes = [];
        });
      }

      if (!hasMore.notes || loading.notes) return;

      set((state) => {
        state.loading.notes = true;
      });

      try {
        const db = getDB();
        // 获取用户发布的笔记列表
        const { data: noteList } = await db
          .collection("notes")
          .where({
            _openid: userId,
          })
          .orderBy("createTime", "desc")
          .skip((refresh ? 0 : currentPage.notes - 1) * pageSize)
          .limit(pageSize)
          .get();

        // 获取每条笔记的详细信息
        const notesWithDetails = await Promise.all(
          noteList.map(async (note) => {
            // 获取作者信息
            const { data } = await db
              .collection("users")
              .where({
                _openid: note._openid,
              })
              .get();
            const author = data[0];

            // 获取点赞和收藏状态
            let isLiked = false;
            let isCollected = false;

            // 获取点赞状态
            const { total: likeCount } = await db
              .collection("likes")
              .where({
                noteId: note._id,
                userId: userId,
              })
              .count();
            isLiked = likeCount > 0;

            // 获取收藏状态
            const { total: collectCount } = await db
              .collection("collections")
              .where({
                noteId: note._id,
                userId: userId,
              })
              .count();
            isCollected = collectCount > 0;

            return {
              _id: note._id,
              title: note.title,
              content: note.content,
              images: note.images || [],
              author: {
                _id: author?._id || note._openid,
                nickname: author?.nickname || author?.phone,
                phone: author?.phone || "",
                avatarUrl: author?.avatarUrl || "",
              },
              location: note.location,
              likes: note.likes || 0,
              collections: note.collections || 0,
              comments: note.comments || 0,
              createTime: note.createTime,
              updateTime: note.updateTime,
              isLiked,
              isCollected,
            } as Note;
          }),
        );

        set((state) => {
          state.userNotes = refresh
            ? notesWithDetails
            : [...userNotes, ...notesWithDetails];
          state.hasMore.notes = notesWithDetails.length === pageSize;
          state.currentPage.notes = refresh ? 2 : currentPage.notes + 1;
          state.loading.notes = false;
        });
      } catch (error) {
        console.error("获取用户笔记列表失败:", error);
        set((state) => {
          state.loading.notes = false;
        });
        Taro.showToast({
          title: "获取笔记列表失败",
          icon: "none",
        });
      }
    },

    fetchCollectedNotes: async (refresh = false) => {
      const { currentPage, pageSize, collectedNotes, loading, hasMore } = get();
      const userId = Taro.getStorageSync("USER_INFO")?._id;

      if (!userId) {
        Taro.showToast({
          title: "请先登录",
          icon: "none",
        });
        return;
      }

      if (refresh) {
        set((state) => {
          state.currentPage.collected = 1;
          state.hasMore.collected = true;
          state.collectedNotes = [];
        });
      }

      if (!hasMore.collected || loading.collected) return;

      set((state) => {
        state.loading.collected = true;
      });

      try {
        const db = getDB();
        // 获取用户收藏的笔记ID列表
        const { data: collectionList } = await db
          .collection("collections")
          .where({
            userId: userId,
          })
          .orderBy("createTime", "desc")
          .skip((refresh ? 0 : currentPage.collected - 1) * pageSize)
          .limit(pageSize)
          .get();

        // 获取每条笔记的详细信息
        const notesWithDetails = await Promise.all(
          collectionList.map(async (collection) => {
            // 获取笔记信息
            const { data: noteData } = await db
              .collection("notes")
              .where({
                _id: collection.noteId,
              })
              .get();

            if (noteData.length === 0) return null;

            const note = noteData[0];

            // 获取作者信息
            const { data: userData } = await db
              .collection("users")
              .where({
                _openid: note._openid,
              })
              .get();
            const author = userData[0];

            // 获取点赞和收藏状态
            let isLiked = false;
            let isCollected = true; // 已经收藏

            // 获取点赞状态
            const { total: likeCount } = await db
              .collection("likes")
              .where({
                noteId: note._id,
                userId: userId,
              })
              .count();
            isLiked = likeCount > 0;

            return {
              _id: note._id,
              title: note.title,
              content: note.content,
              images: note.images || [],
              author: {
                _id: author?._id || note._openid,
                nickname: author?.nickname || author?.phone,
                phone: author?.phone || "",
                avatarUrl: author?.avatarUrl || "",
              },
              location: note.location,
              likes: note.likes || 0,
              collections: note.collections || 0,
              comments: note.comments || 0,
              createTime: note.createTime,
              updateTime: note.updateTime,
              isLiked,
              isCollected,
            } as Note;
          }),
        );

        // 过滤掉不存在的笔记
        const validNotes = notesWithDetails.filter(
          (note): note is Note => note !== null,
        );

        set((state) => {
          state.collectedNotes = refresh
            ? validNotes
            : [...collectedNotes, ...validNotes];
          state.hasMore.collected = validNotes.length === pageSize;
          state.currentPage.collected = refresh ? 2 : currentPage.collected + 1;
          state.loading.collected = false;
        });
      } catch (error) {
        console.error("获取收藏笔记列表失败:", error);
        set((state) => {
          state.loading.collected = false;
        });
        Taro.showToast({
          title: "获取收藏列表失败",
          icon: "none",
        });
      }
    },

    fetchLikedNotes: async (refresh = false) => {
      const { currentPage, pageSize, likedNotes, loading, hasMore } = get();
      const userId = Taro.getStorageSync("USER_INFO")?._id;

      if (!userId) {
        Taro.showToast({
          title: "请先登录",
          icon: "none",
        });
        return;
      }

      if (refresh) {
        set((state) => {
          state.currentPage.liked = 1;
          state.hasMore.liked = true;
          state.likedNotes = [];
        });
      }

      if (!hasMore.liked || loading.liked) return;

      set((state) => {
        state.loading.liked = true;
      });

      try {
        const db = getDB();
        // 获取用户点赞的笔记ID列表
        const { data: likeList } = await db
          .collection("likes")
          .where({
            userId: userId,
          })
          .orderBy("createTime", "desc")
          .skip((refresh ? 0 : currentPage.liked - 1) * pageSize)
          .limit(pageSize)
          .get();

        // 获取每条笔记的详细信息
        const notesWithDetails = await Promise.all(
          likeList.map(async (like) => {
            // 获取笔记信息
            const { data: noteData } = await db
              .collection("notes")
              .where({
                _id: like.noteId,
              })
              .get();

            if (noteData.length === 0) return null;

            const note = noteData[0];

            // 获取作者信息
            const { data: userData } = await db
              .collection("users")
              .where({
                _openid: note._openid,
              })
              .get();
            const author = userData[0];

            // 获取点赞和收藏状态
            let isLiked = true; // 已经点赞
            let isCollected = false;

            // 获取收藏状态
            const { total: collectCount } = await db
              .collection("collections")
              .where({
                noteId: note._id,
                userId: userId,
              })
              .count();
            isCollected = collectCount > 0;

            return {
              _id: note._id,
              title: note.title,
              content: note.content,
              images: note.images || [],
              author: {
                _id: author?._id || note._openid,
                nickname: author?.nickname || author?.phone,
                phone: author?.phone || "",
                avatarUrl: author?.avatarUrl || "",
              },
              location: note.location,
              likes: note.likes || 0,
              collections: note.collections || 0,
              comments: note.comments || 0,
              createTime: note.createTime,
              updateTime: note.updateTime,
              isLiked,
              isCollected,
            } as Note;
          }),
        );

        // 过滤掉不存在的笔记
        const validNotes = notesWithDetails.filter(
          (note): note is Note => note !== null,
        );

        set((state) => {
          state.likedNotes = refresh
            ? validNotes
            : [...likedNotes, ...validNotes];
          state.hasMore.liked = validNotes.length === pageSize;
          state.currentPage.liked = refresh ? 2 : currentPage.liked + 1;
          state.loading.liked = false;
        });
      } catch (error) {
        console.error("获取点赞笔记列表失败:", error);
        set((state) => {
          state.loading.liked = false;
        });
        Taro.showToast({
          title: "获取点赞列表失败",
          icon: "none",
        });
      }
    },

    fetchUserStats: async () => {
      const userId = Taro.getStorageSync("USER_INFO")?._id;

      if (!userId) {
        Taro.showToast({
          title: "请先登录",
          icon: "none",
        });
        return;
      }

      set((state) => {
        state.loading.stats = true;
      });

      try {
        const db = getDB();

        // 获取用户发布的笔记列表
        const { data: userNotes } = await db
          .collection("notes")
          .where({
            _openid: userId,
          })
          .get();

        // 获取这些笔记的获赞和收藏数
        const noteIds = userNotes.map((note) => note._id);

        // 获取获赞数
        const { total: likesCount } = await db
          .collection("likes")
          .where({
            noteId: db.command.in(noteIds),
          })
          .count();

        // 获取获收藏数
        const { total: collectionsCount } = await db
          .collection("collections")
          .where({
            noteId: db.command.in(noteIds),
          })
          .count();

        set((state) => {
          state.receivedLikes = likesCount;
          state.receivedCollections = collectionsCount;
          state.loading.stats = false;
        });
      } catch (error) {
        console.error("获取用户统计数据失败:", error);
        set((state) => {
          state.loading.stats = false;
        });
        Taro.showToast({
          title: "获取统计数据失败",
          icon: "none",
        });
      }
    },

    refreshAllData: async () => {
      const {
        fetchUserNotes,
        fetchCollectedNotes,
        fetchLikedNotes,
        fetchUserStats,
      } = get();

      try {
        await Promise.all([
          fetchUserNotes(true),
          fetchCollectedNotes(true),
          fetchLikedNotes(true),
          fetchUserStats(),
        ]);
      } catch (error) {
        console.error("刷新数据失败:", error);
        Taro.showToast({
          title: "刷新失败",
          icon: "none",
        });
      }
    },

    resetState: () => {
      set((state) => {
        state.userNotes = [];
        state.collectedNotes = [];
        state.likedNotes = [];
        state.receivedLikes = 0;
        state.receivedCollections = 0;
        state.loading = {
          notes: false,
          collected: false,
          liked: false,
          stats: false,
        };
        state.hasMore = {
          notes: true,
          collected: true,
          liked: true,
        };
        state.currentPage = {
          notes: 1,
          collected: 1,
          liked: 1,
        };
      });
    },
  })),
);
