import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import Taro from "@tarojs/taro";
import type { NoteState, Note } from "../types";
import { getDB } from "@/services/cloud";

const AVATAR_URL = ""; //"https://placeholder.com/50";
const DEFAULT_NICKNAME = "somebody";

export const useNoteStore = create<NoteState>()(
  immer((set, get) => ({
    notes: [],
    currentNote: null,
    loading: false,
    hasMore: true,
    currentPage: 1,
    pageSize: 20,

    fetchNotes: async (refresh = false) => {
      const { currentPage, pageSize, notes } = get();
      // console.log(notes, "fetchNotes...");

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
        // 获取笔记列表
        const { data: noteList } = await db
          .collection("notes")
          .orderBy("createTime", "desc")
          .skip((refresh ? 0 : currentPage - 1) * pageSize)
          .limit(pageSize)
          .get();

        // 获取每条笔记的作者信息、点赞状态和收藏状态
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

            // 获取点赞和收藏状态（仅在登录状态下）
            const currentUserId = Taro.getStorageSync("USER_INFO")?._id;
            let isLiked = false;
            let isCollected = false;

            if (currentUserId) {
              // 获取点赞状态
              const { total: likeCount } = await db
                .collection("likes")
                .where({
                  noteId: note._id,
                  userId: currentUserId,
                })
                .count();
              isLiked = likeCount > 0;

              // 获取收藏状态
              const { total: collectCount } = await db
                .collection("collections")
                .where({
                  noteId: note._id,
                  userId: currentUserId,
                })
                .count();
              isCollected = collectCount > 0;
            }

            return {
              ...note,
              author: {
                _id: author?._id || note._openid,
                nickname: author?.nickName || author?.phone,
                avatarUrl: author?.avatarUrl || AVATAR_URL,
              },
              isLiked,
              isCollected,
            };
          }),
        );

        set((state) => {
          state.notes = refresh
            ? notesWithDetails
            : [...notes, ...notesWithDetails];
          state.hasMore = notesWithDetails.length === pageSize;
          state.currentPage = refresh ? 2 : currentPage + 1;
          state.loading = false;
        });
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
      console.log(noteId, "fetchNoteDetail...");

      try {
        set((state) => {
          state.loading = true;
        });

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
            nickname: author?.nickName || author?.phone,
            avatarUrl: author?.avatarUrl || AVATAR_URL,
          },
          isLiked,
          isCollected,
        };

        set((state) => {
          state.currentNote = noteWithDetails;
          state.loading = false;
        });
      } catch (error) {
        console.error("获取笔记详情失败:", error);
        set((state) => {
          state.loading = false;
        });
        Taro.showToast({
          title: "获取笔记详情失败",
          icon: "none",
        });
      }
    },

    likeNote: async (noteId: string) => {
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
        }

        // 更新状态
        const { currentNote, notes } = get();
        if (currentNote?._id === noteId) {
          set((state) => {
            if (state.currentNote) {
              state.currentNote.isLiked = !state.currentNote.isLiked;
              state.currentNote.likes += state.currentNote.isLiked ? 1 : -1;
            }
          });
        }

        const noteIndex = notes.findIndex((note) => note._id === noteId);
        if (noteIndex > -1) {
          set((state) => {
            state.notes[noteIndex].isLiked = !state.notes[noteIndex].isLiked;
            state.notes[noteIndex].likes += state.notes[noteIndex].isLiked
              ? 1
              : -1;
          });
        }
      } catch (error) {
        console.error("点赞失败:", error);
        Taro.showToast({
          title: error.message || "操作失败",
          icon: "none",
        });
      }
    },

    collectNote: async (noteId: string) => {
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
        const { currentNote, notes } = get();
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
  })),
);
