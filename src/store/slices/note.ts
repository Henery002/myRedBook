import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import Taro from "@tarojs/taro";
import type { NoteState, Note } from "../types";
import { getDB } from "@/services/cloud";

const AVATAR_URL = ""; //"https://placeholder.com/50";
const DEFAULT_NICKNAME = "somebody";

// 缓存相关常量
const NOTES_CACHE_KEY = "CACHED_NOTES";
const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 缓存有效期：5分钟

export const useNoteStore = create<NoteState>()(
  immer((set, get) => ({
    notes: [],
    currentNote: null,
    loading: false,
    hasMore: true,
    currentPage: 1,
    pageSize: 20,
    lastFetchTime: 0,
    noteDetailCache: {},
    noteDetailLoading: false,
    noteDetailError: null,

    // 检查并获取缓存
    getNotesFromCache: () => {
      const cached = Taro.getStorageSync("notesCache");
      if (!cached) return false;

      const { data, timestamp } = cached;
      if (Date.now() - timestamp > CACHE_EXPIRY_TIME) {
        Taro.removeStorageSync("notesCache");
        return false;
      }

      set((state) => {
        state.notes = data;
        state.lastFetchTime = timestamp;
      });
      return true;
    },

    // 保存数据到缓存
    saveNotesToCache: () => {
      const { notes } = get();
      Taro.setStorageSync("notesCache", {
        data: notes,
        timestamp: Date.now(),
      });
    },

    // 清除缓存
    clearNotesCache: () => {
      Taro.removeStorageSync("notesCache");
      set((state) => {
        state.notes = [];
        state.lastFetchTime = 0;
      });
    },

    fetchNotes: async (refresh = false, forceUpdate = false) => {
      const { currentPage, pageSize, notes, lastFetchTime } = get();

      // 如果不是强制刷新，且不是下拉刷新，且距离上次加载时间不超过缓存有效期，则尝试从缓存加载
      if (
        !forceUpdate &&
        !refresh &&
        Date.now() - lastFetchTime < CACHE_EXPIRY_TIME
      ) {
        const hasCache = get().getNotesFromCache();
        if (hasCache) {
          return;
        }
      }

      if (refresh) {
        set((state) => {
          state.currentPage = 1;
          state.hasMore = true;
          state.notes = [];
        });
      }

      if (!get().hasMore || get().loading) return;

      set((state) => {
        state.loading = true;
      });

      try {
        const db = getDB();
        const currentUserId = Taro.getStorageSync("USER_INFO")?._id;

        // 获取笔记列表
        const { data: noteList } = await db
          .collection("notes")
          .orderBy("createTime", "desc")
          .skip((refresh ? 0 : currentPage - 1) * pageSize)
          .limit(pageSize)
          .get();

        // 获取所有笔记的作者ID列表，以减少查询次数
        const authorIds = [...new Set(noteList.map((note) => note._openid))];

        // 批量获取作者信息
        let authors = {};
        if (authorIds.length > 0) {
          const { data: authorList } = await db
            .collection("users")
            .where({
              _openid: db.command.in(authorIds),
            })
            .get();

          authors = authorList.reduce((acc, author) => {
            acc[author._openid] = author;
            return acc;
          }, {});
        }

        // 如果用户已登录，批量获取点赞和收藏状态
        let likedNoteIds = [];
        let collectedNoteIds = [];

        if (currentUserId && noteList.length > 0) {
          const noteIds = noteList.map((note) => note._id);

          // 批量获取点赞状态
          const { data: likeList } = await db
            .collection("likes")
            .where({
              noteId: db.command.in(noteIds),
              userId: currentUserId,
            })
            .get();

          likedNoteIds = likeList.map((like) => like.noteId);

          // 批量获取收藏状态
          const { data: collectList } = await db
            .collection("collections")
            .where({
              noteId: db.command.in(noteIds),
              userId: currentUserId,
            })
            .get();

          collectedNoteIds = collectList.map((collect) => collect.noteId);
        }

        // 组装笔记详情
        const notesWithDetails = noteList.map((note) => {
          const author = authors[note._openid] || {};

          return {
            ...note,
            author: {
              _id: author?._id || note._openid,
              nickname: author?.nickname || author?.phone || DEFAULT_NICKNAME,
              avatarUrl: author?.avatarUrl || AVATAR_URL,
            },
            isLiked: likedNoteIds.includes(note._id),
            isCollected: collectedNoteIds.includes(note._id),
          };
        });

        set((state) => {
          state.notes = refresh
            ? notesWithDetails
            : [...notes, ...notesWithDetails];
          state.hasMore = notesWithDetails.length === pageSize;
          state.currentPage = refresh ? 2 : currentPage + 1;
          state.loading = false;
          state.lastFetchTime = Date.now();
        });

        // 保存到缓存
        get().saveNotesToCache();
      } catch (error) {
        console.error("获取笔记列表失败:", error);
        set((state) => {
          state.loading = false;
        });
        Taro.showToast({
          title: "获取笔记列表失败",
          icon: "none",
        });
      }
    },

    fetchNoteDetail: async (noteId: string) => {
      console.log("fetchNoteDetail 开始执行，noteId:", noteId);
      const { noteDetailCache } = get();

      // 检查缓存
      const cached = noteDetailCache[noteId];
      if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY_TIME) {
        console.log("使用缓存数据");
        set((state) => {
          state.currentNote = cached.data;
        });
        return cached.data;
      }

      set((state) => {
        state.noteDetailLoading = true;
        state.noteDetailError = null;
      });

      try {
        console.log("从数据库获取笔记详情");
        const db = getDB();
        const { data } = await db
          .collection("notes")
          .where({
            _id: noteId,
          })
          .get();

        const note = data[0];
        if (!note) {
          throw new Error("笔记不存在");
        }

        // 获取作者信息
        const { data: userData } = await db
          .collection("users")
          .where({
            _openid: note._openid,
          })
          .get();
        const author = userData[0];

        // 获取点赞和收藏状态（仅在登录状态下）
        const currentUserId = Taro.getStorageSync("USER_INFO")?._id;
        let isLiked = false;
        let isCollected = false;

        if (currentUserId) {
          // 获取点赞状态
          const { total: likeCount } = await db
            .collection("likes")
            .where({
              noteId,
              userId: currentUserId,
            })
            .count();
          isLiked = likeCount > 0;

          // 获取收藏状态
          const { total: collectCount } = await db
            .collection("collections")
            .where({
              noteId,
              userId: currentUserId,
            })
            .count();
          isCollected = collectCount > 0;
        }

        const noteWithDetails = {
          ...note,
          author: {
            _id: author?._id || note._openid,
            nickname: author?.nickname || author?.phone || DEFAULT_NICKNAME,
            avatarUrl: author?.avatarUrl || AVATAR_URL,
          },
          isLiked,
          isCollected,
        };

        console.log("组装后的笔记数据:", noteWithDetails);

        // 更新缓存
        set((state) => {
          state.noteDetailCache[noteId] = {
            data: noteWithDetails,
            timestamp: Date.now(),
          };
          state.currentNote = noteWithDetails;
          state.noteDetailLoading = false;
        });

        return noteWithDetails;
      } catch (error) {
        console.error("获取笔记详情失败:", error);
        set((state) => {
          state.noteDetailError = error.message;
          state.noteDetailLoading = false;
        });
        return null;
      }
    },

    updateNoteInList: (updatedNote) => {
      const { notes } = get();
      const noteIndex = notes.findIndex((note) => note._id === updatedNote._id);

      if (noteIndex !== -1) {
        set((state) => {
          state.notes[noteIndex] = {
            ...state.notes[noteIndex],
            ...updatedNote,
          };
        });

        // 更新缓存
        get().saveNotesToCache();
      }
    },

    likeNote: async (noteId: string) => {
      const { currentNote, notes } = get();

      try {
        const userId = Taro.getStorageSync("USER_INFO")?._id;

        if (!userId) {
          throw new Error("请先登录");
        }

        const db = getDB();
        const { total } = await db
          .collection("likes")
          .where({
            noteId,
            userId,
          })
          .count();

        if (total > 0) {
          // 取消点赞
          await db
            .collection("likes")
            .where({
              noteId,
              userId,
            })
            .remove();

          // 更新笔记点赞数
          await db
            .collection("notes")
            .where({
              _id: noteId,
            })
            .update({
              data: {
                likes: db.command.inc(-1),
              },
            });

          // 更新当前笔记状态
          if (currentNote && currentNote._id === noteId) {
            set((state) => {
              state.currentNote = {
                ...state.currentNote,
                isLiked: false,
                likes: Math.max(0, (state.currentNote?.likes || 1) - 1),
              };
            });
          }

          // 更新列表中的笔记状态
          get().updateNoteInList({
            _id: noteId,
            isLiked: false,
            likes: Math.max(
              0,
              (get().notes.find((n) => n._id === noteId)?.likes || 1) - 1,
            ),
          });
        } else {
          // 添加点赞
          await db.collection("likes").add({
            data: {
              noteId,
              userId,
              createTime: db.serverDate(),
            },
          });

          // 更新笔记点赞数
          await db
            .collection("notes")
            .where({
              _id: noteId,
            })
            .update({
              data: {
                likes: db.command.inc(1),
              },
            });

          // 更新当前笔记状态
          if (currentNote && currentNote._id === noteId) {
            set((state) => {
              state.currentNote = {
                ...state.currentNote,
                isLiked: true,
                likes: (state.currentNote?.likes || 0) + 1,
              };
            });
          }

          // 更新列表中的笔记状态
          get().updateNoteInList({
            _id: noteId,
            isLiked: true,
            likes: (get().notes.find((n) => n._id === noteId)?.likes || 0) + 1,
          });
        }
      } catch (error) {
        console.error("点赞失败:", error);
        Taro.showToast({
          title: "操作失败",
          icon: "none",
        });
      }
    },

    collectNote: async (noteId: string) => {
      const { currentNote, notes } = get();

      try {
        const userId = Taro.getStorageSync("USER_INFO")?._id;

        if (!userId) {
          throw new Error("请先登录");
        }

        const db = getDB();
        const { total } = await db
          .collection("collections")
          .where({
            noteId,
            userId,
          })
          .count();

        if (total > 0) {
          // 取消收藏
          await db
            .collection("collections")
            .where({
              noteId,
              userId,
            })
            .remove();

          // 更新笔记收藏数
          await db
            .collection("notes")
            .where({
              _id: noteId,
            })
            .update({
              data: {
                collections: db.command.inc(-1),
              },
            });
        } else {
          // 添加收藏
          await db.collection("collections").add({
            data: {
              noteId,
              userId,
              createTime: db.serverDate(),
            },
          });

          // 更新笔记收藏数
          await db
            .collection("notes")
            .where({
              _id: noteId,
            })
            .update({
              data: {
                collections: db.command.inc(1),
              },
            });
        }

        // 更新状态
        if (currentNote?._id === noteId) {
          set((state) => {
            if (state.currentNote) {
              state.currentNote.isCollected = !state.currentNote.isCollected;
              state.currentNote.collections += state.currentNote.isCollected
                ? 1
                : -1;
            }
          });
        }

        const noteIndex = notes.findIndex((note) => note._id === noteId);
        if (noteIndex > -1) {
          set((state) => {
            state.notes[noteIndex].isCollected =
              !state.notes[noteIndex].isCollected;
            state.notes[noteIndex].collections += state.notes[noteIndex]
              .isCollected
              ? 1
              : -1;
          });
        }
      } catch (error) {
        console.error("收藏失败:", error);
        Taro.showToast({
          title: error.message || "操作失败",
          icon: "none",
        });
      }
    },

    resetCurrentNote: () => {
      set((state) => {
        state.currentNote = null;
      });
    },

    clearNoteDetailCache: (noteId?: string) => {
      set((state) => {
        if (noteId) {
          delete state.noteDetailCache[noteId];
        } else {
          state.noteDetailCache = {};
        }
      });
    },
  })),
);
