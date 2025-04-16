import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import Taro from "@tarojs/taro";
import { getDB } from "@/services/cloud";
import type { Comment } from "../types";

interface CommentState {
  comments: Comment[];
  loading: boolean;
  hasMore: boolean;
  currentPage: number;
  pageSize: number;
  replyTo: {
    commentId: string;
    userId: string;
    nickname: string;
  } | null;

  // 获取评论列表
  fetchComments: (noteId: string, refresh?: boolean) => Promise<void>;
  // 发表评论
  addComment: (
    noteId: string,
    content: string,
    images?: string[],
  ) => Promise<boolean>;
  // 回复评论
  replyComment: (
    noteId: string,
    content: string,
    images?: string[],
  ) => Promise<boolean>;
  // 设置回复目标
  setReplyTo: (comment: Comment | null) => void;
  // 展开/收起回复
  toggleReplies: (commentId: string) => Promise<void>;
  // 点赞评论
  likeComment: (commentId: string) => Promise<void>;
}

export const useCommentStore = create<CommentState>()(
  immer((set, get) => ({
    comments: [],
    loading: false,
    hasMore: true,
    currentPage: 1,
    pageSize: 20,
    replyTo: null,

    fetchComments: async (noteId: string, refresh = false) => {
      const { currentPage, pageSize, comments } = get();

      if (refresh) {
        set((state) => {
          state.currentPage = 1;
          state.hasMore = true;
          state.comments = [];
        });
      }

      if (!get().hasMore || get().loading) return;

      set((state) => {
        state.loading = true;
      });

      try {
        const db = getDB();
        const { data } = await db
          .collection("comments")
          .where({
            noteId,
            parentId: null, // 只获取顶层评论
          })
          .orderBy("createdAt", "desc")
          .skip((refresh ? 0 : currentPage - 1) * pageSize)
          .limit(pageSize)
          .get();

        // 获取每条评论的回复数
        const commentsWithReplies = await Promise.all(
          data.map(async (comment) => {
            const { total } = await db
              .collection("comments")
              .where({
                parentId: comment._id,
              })
              .count();
            return {
              ...comment,
              replies: total,
            };
          }),
        );

        set((state) => {
          state.comments = refresh
            ? commentsWithReplies
            : [...comments, ...commentsWithReplies];
          state.hasMore = commentsWithReplies.length === pageSize;
          state.currentPage = refresh ? 2 : currentPage + 1;
          state.loading = false;
        });
      } catch (error) {
        console.error("获取评论失败:", error);
        set((state) => {
          state.loading = false;
        });
      }
    },

    addComment: async (noteId: string, content: string, images = []) => {
      try {
        const db = getDB();
        await db.collection("comments").add({
          data: {
            noteId,
            content,
            images,
            createdAt: db.serverDate(),
            updatedAt: db.serverDate(),
            likes: 0,
            replies: 0,
          },
        });

        // 刷新评论列表
        await get().fetchComments(noteId, true);
        return true;
      } catch (error) {
        console.error("发表评论失败:", error);
        return false;
      }
    },

    replyComment: async (noteId: string, content: string, images = []) => {
      const { replyTo } = get();
      if (!replyTo) return false;

      try {
        const db = getDB();
        await db.collection("comments").add({
          data: {
            noteId,
            content,
            images,
            replyToComment: replyTo.commentId,
            replyToUser: replyTo.userId,
            parentId: replyTo.commentId,
            createdAt: db.serverDate(),
            updatedAt: db.serverDate(),
            likes: 0,
            replies: 0,
          },
        });

        // 更新父评论的回复数
        await db
          .collection("comments")
          .doc(replyTo.commentId)
          .update({
            data: {
              replies: db.command.inc(1),
            },
          });

        // 刷新评论列表
        await get().fetchComments(noteId, true);
        return true;
      } catch (error) {
        console.error("回复评论失败:", error);
        return false;
      }
    },

    setReplyTo: (comment) => {
      set((state) => {
        state.replyTo = comment
          ? {
              commentId: comment._id,
              userId: comment.author._id,
              nickname: comment.author.nickname,
            }
          : null;
      });
    },

    toggleReplies: async (commentId: string) => {
      const db = getDB();
      const { data } = await db
        .collection("comments")
        .where({
          parentId: commentId,
        })
        .orderBy("createdAt", "desc")
        .get();

      set((state) => {
        const commentIndex = state.comments.findIndex(
          (c) => c._id === commentId,
        );
        if (commentIndex > -1) {
          state.comments[commentIndex].replies = data;
          state.comments[commentIndex].showReplies =
            !state.comments[commentIndex].showReplies;
        }
      });
    },

    likeComment: async (commentId: string) => {
      try {
        const db = getDB();
        await db
          .collection("comments")
          .doc(commentId)
          .update({
            data: {
              likes: db.command.inc(1),
            },
          });

        set((state) => {
          const commentIndex = state.comments.findIndex(
            (c) => c._id === commentId,
          );
          if (commentIndex > -1) {
            state.comments[commentIndex].likes += 1;
          }
        });
      } catch (error) {
        console.error("点赞失败:", error);
      }
    },
  })),
);
