import { useState, useEffect, useCallback } from "react";
import { View, Text, Image, Input, ScrollView } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { AtIcon, AtActivityIndicator, AtButton } from "taro-ui";
import { formatNumber, formatTime, formatLikes } from "@/utils/format";
import styles from "./index.less";
import { useCommentStore } from "@/store";
import type { Comment as StoreComment } from "@/store/types";

interface Props {
  noteId: string;
}

// 在组件内部使用的评论类型接口
interface Comment {
  _id: string;
  _openid: string;
  noteId: string;
  content: string;
  images?: string[];
  avatar: string;
  nickname: string;
  address?: string;
  likes: number;
  createdAt: string;
  updatedAt: string;
  replies?: number | Comment[];
  parentId?: string;
  replyTo?: {
    _id: string;
    nickname: string;
  };
  showReplies?: boolean;
}

export default function CommentSection({ noteId }: Props) {
  const { comments, loading, hasMore, currentPage, replyTo } =
    useCommentStore();
  const [commentText, setCommentText] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [showCommentPanel, setShowCommentPanel] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [windowHeight, setWindowHeight] = useState(0);
  const [currentReplyComment, setCurrentReplyComment] =
    useState<Comment | null>(null);

  const {
    addComment,
    fetchComments,
    likeComment,
    setReplyTo,
    replyComment,
    toggleReplies,
  } = useCommentStore();

  // 获取窗口高度
  useEffect(() => {
    const systemInfo = Taro.getSystemInfoSync();
    setWindowHeight(systemInfo.windowHeight);
  }, []);

  const handleFetchComments = useCallback(
    async (pageNum: number = 1, refresh: boolean = false) => {
      try {
        await fetchComments(noteId, refresh);
      } catch (error) {
        console.error("加载评论失败", error);
        Taro.showToast({
          title: "加载评论失败",
          icon: "none",
        });
      }
    },
    [noteId, fetchComments],
  );

  useEffect(() => {
    handleFetchComments(1, true);
  }, [handleFetchComments]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      handleFetchComments(currentPage + 1);
    }
  }, [loading, hasMore, currentPage, handleFetchComments]);

  const handleChooseImage = useCallback(async () => {
    try {
      const res = await Taro.chooseImage({
        count: 9 - selectedImages.length,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
      });
      setSelectedImages((prev) => [...prev, ...res.tempFilePaths]);
    } catch (error) {
      console.log("选择图片失败", error);
    }
  }, [selectedImages]);

  const handleDeleteImage = useCallback((index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleCommentInputClick = useCallback(
    (comment?: Comment) => {
      setShowCommentPanel(true);
      setIsClosing(false);

      // 如果是回复某条评论
      if (comment) {
        setCurrentReplyComment(comment);
        // 转换为store需要的格式
        const replyToComment = {
          _id: comment._id,
          nickname: comment.nickname,
        };
        setReplyTo(replyToComment);
      } else {
        // 如果是新评论，清除回复状态
        setCurrentReplyComment(null);
        setReplyTo(null);
      }
    },
    [setReplyTo],
  );

  const handleMaskClick = useCallback(
    (e: any) => {
      if (e.target === e.currentTarget) {
        setIsClosing(true);
        setTimeout(() => {
          setShowCommentPanel(false);
          setIsClosing(false);
          setKeyboardHeight(0);
          setCurrentReplyComment(null);
          setReplyTo(null);
        }, 200);
      }
    },
    [setReplyTo],
  );

  // 监听键盘高度变化
  useEffect(() => {
    if (showCommentPanel) {
      const handleKeyboardHeightChange = (e: any) => {
        const height = e?.detail?.height || e?.height || 0;
        setKeyboardHeight(height);
      };

      Taro.onKeyboardHeightChange(handleKeyboardHeightChange);

      return () => {
        Taro.offKeyboardHeightChange(handleKeyboardHeightChange);
      };
    }
  }, [showCommentPanel]);

  const handleSendComment = useCallback(async () => {
    if (!commentText.trim() && selectedImages.length === 0) {
      Taro.showToast({
        title: "请输入评论内容或选择图片",
        icon: "none",
      });
      return;
    }

    try {
      let uploadedImages: string[] = [];

      // 1. 如果有图片，先上传图片
      if (selectedImages.length > 0) {
        const uploadTasks = selectedImages.map((path) =>
          Taro.cloud.uploadFile({
            cloudPath: `comments/${Date.now()}-${Math.random().toString(36).slice(2)}.${path.split(".").pop()}`,
            filePath: path,
          }),
        );
        const results = await Promise.all(uploadTasks);
        uploadedImages = results.map((res) => res.fileID);
      }

      let success = false;

      // 2. 判断是回复还是新评论
      if (currentReplyComment) {
        // 使用replyComment方法回复评论
        success = await replyComment(noteId, commentText, uploadedImages);
      } else {
        // 使用addComment方法添加新评论
        success = await addComment(noteId, commentText, uploadedImages);
      }

      if (success) {
        // 3. 清空输入和图片
        setCommentText("");
        setSelectedImages([]);
        setShowEmojiPanel(false);
        setShowCommentPanel(false);
        setCurrentReplyComment(null);
        setReplyTo(null);

        Taro.showToast({
          title: "评论成功",
          icon: "none",
        });

        // 4. 刷新评论列表
        handleFetchComments(1, true);
      } else {
        throw new Error("评论失败");
      }
    } catch (error) {
      console.error("评论失败:", error);
      Taro.showToast({
        title: "评论失败",
        icon: "none",
      });
    }
  }, [
    commentText,
    selectedImages,
    noteId,
    addComment,
    replyComment,
    currentReplyComment,
    setReplyTo,
    handleFetchComments,
  ]);

  const handleLikeComment = useCallback(
    async (commentId: string) => {
      try {
        await likeComment(commentId);
      } catch (error) {
        console.error("点赞失败:", error);
        Taro.showToast({
          title: "点赞失败",
          icon: "none",
        });
      }
    },
    [likeComment],
  );

  const handleShowReplies = useCallback(
    (commentId: string) => {
      toggleReplies(commentId);
    },
    [toggleReplies],
  );

  const handleAvatarClick = useCallback((comment: Comment) => {
    Taro.navigateTo({
      url: `/pages/user/index?userId=${comment?._openid}`,
    });
  }, []);

  const renderCommentReplyItem = useCallback(
    (reply: Comment) => {
      return (
        <View className={styles.commentReply} key={reply._id}>
          <Image
            onClick={() => handleAvatarClick(reply)}
            className={styles.avatar}
            src={reply.avatar}
            mode="aspectFill"
            lazyLoad
          />
          <View className={styles.replyContent}>
            <View
              className={styles.headerLeft}
              onClick={() => handleCommentInputClick(reply)}
            >
              <View className={styles.header}>
                <Text className={styles.nickname}>
                  {reply.nickname || "未知用户"}
                </Text>
                {reply.replyTo && (
                  <Text className={styles.replyToText}>
                    回复{" "}
                    <Text className={styles.replyToName}>
                      {reply.replyTo.nickname}
                    </Text>
                  </Text>
                )}
              </View>
              <Text className={styles.text}>{reply.content}</Text>
              <Text className={styles.textSuffix}>
                <Text className={styles.suffixTime}>
                  {formatTime(reply.createdAt)}
                </Text>
                <Text className={styles.suffixAddress}>
                  {reply?.address || "未知"}
                </Text>
                <Text className={styles.suffixReply}>回复</Text>
              </Text>
            </View>
            <View
              className={styles.actionItem}
              onClick={() => handleLikeComment(reply._id)}
            >
              <AtIcon value="heart" size="16" />
              <Text className={styles.text}>
                {formatLikes(reply.likes || 0)}
              </Text>
            </View>
          </View>
        </View>
      );
    },
    [handleAvatarClick, handleCommentInputClick, handleLikeComment],
  );

  const renderCommentItem = useCallback(
    (comment: Comment) => {
      return (
        <View className={styles.commentItem} key={comment._id}>
          <Image
            onClick={() => handleAvatarClick(comment)}
            className={styles.avatar}
            src={comment.avatar}
            mode="aspectFill"
            lazyLoad
          />
          <View className={styles.commentContent}>
            <View className={styles.commentSelfHeader}>
              <View
                className={styles.headerLeft}
                onClick={() => handleCommentInputClick(comment)}
              >
                <View className={styles.header}>
                  <Text className={styles.nickname}>
                    {comment.nickname || "未知"}
                  </Text>
                </View>
                <Text className={styles.text}>{comment.content}</Text>
                <Text className={styles.textSuffix}>
                  <Text className={styles.suffixTime}>
                    {formatTime(comment.createdAt)}
                  </Text>
                  <Text className={styles.suffixAddress}>
                    {comment?.address || "未知"}
                  </Text>
                  <Text className={styles.suffixReply}>回复</Text>
                </Text>
              </View>
              <View
                className={styles.actionItem}
                onClick={() => handleLikeComment(comment._id)}
              >
                <AtIcon value="heart" size="16" />
                <Text className={styles.text}>
                  {formatLikes(comment.likes || 0)}
                </Text>
              </View>
            </View>

            {/* 评论回复列表 */}
            {comment.showReplies &&
              Array.isArray(comment.replies) &&
              comment.replies.length > 0 && (
                <View className={styles.commentReplyList}>
                  {comment.replies.map((reply) =>
                    renderCommentReplyItem(reply),
                  )}
                </View>
              )}

            {/* 查看回复按钮 */}
            {!comment.showReplies &&
              typeof comment.replies === "number" &&
              comment.replies > 0 && (
                <View
                  className={styles.viewReplies}
                  onClick={() => handleShowReplies(comment._id)}
                >
                  查看 {comment.replies} 条回复
                </View>
              )}

            {/* 隐藏回复按钮 */}
            {comment.showReplies &&
              Array.isArray(comment.replies) &&
              comment.replies.length > 0 && (
                <View
                  className={styles.viewReplies}
                  onClick={() => handleShowReplies(comment._id)}
                >
                  收起回复
                </View>
              )}
          </View>
        </View>
      );
    },
    [
      handleAvatarClick,
      handleCommentInputClick,
      handleLikeComment,
      handleShowReplies,
      renderCommentReplyItem,
    ],
  );

  return (
    <View className={styles.commentSection}>
      <View className={styles.commentTopHeader}>
        <Text className={styles.commentCount}>
          共 {`${formatNumber(comments.length)}`} 条评论
        </Text>
      </View>

      <View className={styles.commentBox}>
        <View
          className={styles.inputWrapper}
          onClick={() => handleCommentInputClick()}
        >
          <Input
            className={styles.commentInput}
            value={""}
            placeholder="说点什么..."
            disabled={true}
          />
        </View>
      </View>

      <ScrollView
        scrollY
        className={styles.commentList}
        onScrollToLower={handleLoadMore}
      >
        {comments.map((comment) =>
          renderCommentItem(comment as unknown as Comment),
        )}
        {loading && <AtActivityIndicator content="加载中..." color="#f09c20" />}
        {!loading && !hasMore && comments.length > 0 && (
          <View className={styles.loading}>- 没有更多评论了 -</View>
        )}
      </ScrollView>

      {showCommentPanel && (
        <View
          className={`${styles.mask} ${isClosing ? styles.closing : ""}`}
          onClick={handleMaskClick}
        />
      )}
      <View
        className={`${styles.commentPanelWrapper} ${showCommentPanel ? styles.show : ""} ${isClosing ? styles.closing : ""}`}
        style={{
          position: "fixed",
          bottom: keyboardHeight > 0 ? `${keyboardHeight}px` : "0",
          transform: showCommentPanel ? "translateY(0)" : "translateY(100%)",
          transition: isClosing
            ? "transform 0.2s ease-out"
            : "all 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <View className={styles.panelContent}>
          {currentReplyComment && (
            <View className={styles.replyToInfo}>
              回复{" "}
              <Text className={styles.replyToName}>
                {currentReplyComment.nickname}
              </Text>
              <View
                className={styles.replyToCancel}
                onClick={() => {
                  setCurrentReplyComment(null);
                  setReplyTo(null);
                }}
              >
                <AtIcon value="close" size="14" color="#999" />
              </View>
            </View>
          )}
          <View className={styles.textareaWrapper}>
            <Input
              type="text"
              maxlength={500}
              value={commentText}
              adjustPosition={false}
              focus={showCommentPanel}
              className={styles.textarea}
              placeholder={
                currentReplyComment
                  ? `回复 ${currentReplyComment.nickname}...`
                  : "良言一句三冬暖，恶语伤人律师函..."
              }
              onInput={(e) => setCommentText(e.detail.value)}
            />
          </View>
          <View className={styles.panelFooter}>
            <View className={styles.toolbar}>
              <View className={styles.toolbarItem} onClick={() => {}}>
                <AtIcon value="tag" size="22" color="#666" />
              </View>
              <View
                className={styles.toolbarItem}
                onClick={() => setShowEmojiPanel(!showEmojiPanel)}
              >
                <AtIcon value="lightning-bolt" size="22" color="#666" />
              </View>
              <View className={styles.toolbarItem} onClick={handleChooseImage}>
                <AtIcon value="image" size="22" color="#666" />
              </View>
            </View>
            <AtButton
              className={`${styles.sendButton} ${commentText.trim() ? styles.active : ""}`}
              loading={loading}
              onClick={handleSendComment}
            >
              发送
            </AtButton>
          </View>
        </View>
      </View>
    </View>
  );
}
