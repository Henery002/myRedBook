import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import Taro from "@tarojs/taro";
import { getDB } from "@/services/cloud";

// 定义评论接口，与数据库结构一致
interface CommentItem {
  _id: string;
  _openid: string; // 评论者的openid
  noteId: string; // 所属笔记ID
  content: string; // 评论内容
  images?: string[]; // 评论图片 (可选)
  avatar: string; // 评论者头像
  nickname: string; // 评论者昵称
  address?: string; // 评论者地址 (可选)
  likes: number; // 点赞数
  createdAt: string; // 创建时间
  updatedAt: string; // 更新时间
  replies?: number | CommentItem[]; // 回复数量或回复数组
  parentId?: string; // 父评论ID，用于回复
  replyTo?: {
    _id: string;
    nickname: string;
  }; // 回复目标信息
  showReplies?: boolean; // UI状态：是否显示回复列表
}

interface CommentState {
  comments: CommentItem[];
  loading: boolean;
  hasMore: boolean;
  currentPage: number;
  pageSize: number;
  replyTo: {
    _id: string;
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
  setReplyTo: (comment: CommentItem | null) => void;
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
            // 获取用户信息
            const { data: userData } = await db
              .collection("users")
              .where({
                _openid: comment._openid,
              })
              .get();

            const user = userData[0] || {};

            // 获取回复数量
            const { total } = await db
              .collection("comments")
              .where({
                parentId: comment._id,
              })
              .count();

            // 构建评论对象，确保字段一致
            return {
              ...comment,
              avatar: user.avatarUrl || "",
              nickname: user?.nickname || "用户" + comment._openid.substr(-4),
              replies: total, // 回复数量
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
      set((state) => {
        state.loading = true;
      });

      try {
        const userInfo = Taro.getStorageSync("USER_INFO");
        if (!userInfo) {
          Taro.showToast({
            title: "请先登录",
            icon: "none",
          });
          return false;
        }

        const db = getDB();
        const now = db.serverDate();

        // 添加评论到数据库
        await db.collection("comments").add({
          data: {
            noteId,
            content,
            images,
            createTime: now,
            updateTime: now,
            likes: 0,
            replies: 0,
            parentId: null,
            avatar: userInfo.avatarUrl,
            nickname: userInfo?.nickname,
            address: userInfo.city || "",
          },
        });

        // 增加笔记的评论计数
        await db
          .collection("notes")
          .doc(noteId)
          .update({
            data: {
              comments: db.command.inc(1),
            },
          });

        // 刷新评论列表
        await get().fetchComments(noteId, true);
        return true;
      } catch (error) {
        console.error("发表评论失败:", error);
        return false;
      } finally {
        set((state) => {
          state.loading = false;
        });
      }
    },

    replyComment: async (noteId: string, content: string, images = []) => {
      const { replyTo } = get();
      if (!replyTo) return false;

      set((state) => {
        state.loading = true;
      });

      try {
        const userInfo = Taro.getStorageSync("USER_INFO");
        if (!userInfo) {
          Taro.showToast({
            title: "请先登录",
            icon: "none",
          });
          return false;
        }

        const db = getDB();
        const now = db.serverDate();

        // 添加回复到数据库
        await db.collection("comments").add({
          data: {
            noteId,
            content,
            images,
            parentId: replyTo._id, // 父评论ID
            replyTo: {
              _id: replyTo._id,
              nickname: replyTo.nickname,
            },
            createTime: now,
            updateTime: now,
            likes: 0,
            avatar: userInfo.avatarUrl,
            nickname: userInfo?.nickname,
            address: userInfo.city || "",
          },
        });

        // 更新父评论的回复数
        await db
          .collection("comments")
          .doc(replyTo._id)
          .update({
            data: {
              replies: db.command.inc(1),
            },
          });

        // 增加笔记的评论计数
        await db
          .collection("notes")
          .doc(noteId)
          .update({
            data: {
              comments: db.command.inc(1),
            },
          });

        // 刷新评论列表
        await get().fetchComments(noteId, true);
        return true;
      } catch (error) {
        console.error("回复评论失败:", error);
        return false;
      } finally {
        set((state) => {
          state.loading = false;
        });
      }
    },

    setReplyTo: (comment) => {
      set((state) => {
        state.replyTo = comment
          ? {
              _id: comment._id,
              nickname: comment.nickname,
            }
          : null;
      });
    },

    toggleReplies: async (commentId: string) => {
      set((state) => {
        state.loading = true;
      });

      try {
        const db = getDB();
        const commentIndex = get().comments.findIndex(
          (c) => c._id === commentId,
        );

        // 如果评论不存在
        if (commentIndex === -1) return;

        const comment = get().comments[commentIndex];

        // 如果回复列表已经加载，只需切换显示状态
        if (Array.isArray(comment.replies)) {
          set((state) => {
            state.comments[commentIndex].showReplies =
              !state.comments[commentIndex].showReplies;
            state.loading = false;
          });
          return;
        }

        // 加载回复列表
        const { data } = await db
          .collection("comments")
          .where({
            parentId: commentId,
          })
          .orderBy("createdAt", "desc")
          .get();

        // 确保每个回复都有正确的用户信息
        const repliesWithUserInfo = await Promise.all(
          data.map(async (reply) => {
            // 获取用户信息
            const { data: userData } = await db
              .collection("users")
              .where({
                _openid: reply._openid,
              })
              .get();

            const user = userData[0] || {};

            // 构建回复对象
            return {
              ...reply,
              avatar: user.avatarUrl || reply.avatar || "",
              nickname:
                user?.nickname ||
                reply.nickname ||
                "用户" + reply._openid.substr(-4),
            };
          }),
        );

        set((state) => {
          state.comments[commentIndex].replies = repliesWithUserInfo;
          state.comments[commentIndex].showReplies = true;
          state.loading = false;
        });
      } catch (error) {
        console.error("获取回复失败:", error);
        set((state) => {
          state.loading = false;
        });
      }
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
          } else {
            // 检查是否是回复中的评论
            state.comments.forEach((comment, index) => {
              if (Array.isArray(comment.replies)) {
                const replyIndex = comment.replies.findIndex(
                  (reply) => reply._id === commentId,
                );
                if (replyIndex > -1) {
                  state.comments[index].replies[replyIndex].likes += 1;
                }
              }
            });
          }
        });
      } catch (error) {
        console.error("点赞失败:", error);
      }
    },
  })),
);
