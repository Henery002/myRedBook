import { useState, useEffect, useCallback } from "react";
import { View, Text, Image, Input, ScrollView } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { AtIcon, AtActivityIndicator } from "taro-ui";
import { formatNumber, formatTime, formatLikes } from "@/utils/format";
import styles from "./index.less";
import { useCommentStore } from "@/store";

interface Props {
  noteId: string;
}

interface Comment {
  _id: string;
  userId: string;
  avatar: string;
  nickname: string;
  content: string;
  images?: string[];
  createTime: string;
  likes: number;
  isLiked: boolean;
  replies?: Comment[];
}

const PAGE_SIZE = 20;

import { commentData } from "@/pages/mockdata.js";

export default function CommentSection({ noteId }: Props) {
  const { comments, loading, hasMore, currentPage } = useCommentStore();
  const [commentText, setCommentText] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [showCommentPanel, setShowCommentPanel] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const { addComment, fetchComments, likeComment } = useCommentStore();

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

  const handleCommentInputFocus = useCallback((e) => {
    // 获取键盘高度
    const keyboardHeight = e.detail.height || 0;
    setKeyboardHeight(keyboardHeight);
    setShowCommentPanel(true);
  }, []);

  const handleCommentInputBlur = useCallback(() => {
    // 延迟关闭面板，以便点击发送按钮
    setTimeout(() => {
      setShowCommentPanel(false);
      setKeyboardHeight(0);
    }, 200);
  }, []);

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

      // 2. 使用 store 的 addComment 方法发布评论
      const success = await addComment(noteId, commentText, uploadedImages);

      if (success) {
        // 3. 清空输入和图片
        setCommentText("");
        setSelectedImages([]);
        setShowEmojiPanel(false);
        setShowCommentPanel(false);

        Taro.showToast({
          title: "评论成功",
          icon: "none",
        });
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
  }, [commentText, selectedImages, noteId, addComment]);

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

  const handleReplyComment = useCallback((commentId: string) => {
    // 在这里实现回复逻辑
  }, []);

  const handleShowReplies = useCallback((commentId: string) => {
    // 在这里实现展示回复列表的逻辑
  }, []);

  const renderCommentReplyItem = useCallback((reply: Comment) => {
    return (
      <View className={styles.commentReply}>
        <Image className={styles.avatar} src={reply.avatar} mode="widthFix" />
        <View className={styles.replyContent}>
          <View className={styles.headerLeft}>
            <View className={styles.header}>
              <Text className={styles.nickname}>
                {reply.nickname || "不开心和没头脑"}
              </Text>
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
            <Text className={styles.text}>{formatLikes(reply.likes || 0)}</Text>
          </View>
        </View>
      </View>
    );
  }, []);

  const renderCommentItem = useCallback((comment: Comment, isReply = false) => {
    return (
      <View className={styles.commentItem} key={comment._id}>
        <Image className={styles.avatar} src={comment.avatar} mode="widthFix" />
        <View className={styles.commentContent}>
          <View className={styles.commentSelfHeader}>
            <View className={styles.headerLeft}>
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

          {/* 第一条回复整体 */}
          {comment.replies?.length && (
            <View className={styles.commentReplyList}>
              {comment.replies?.map((v) => renderCommentReplyItem(v))}
            </View>
          )}

          {/* {comment.images && comment.images.length > 0 && (
            <View className={styles.imageList}>
              {comment.images.map((image, index) => (
                <Image
                  key={index}
                  className={styles.commentImage}
                  src={image}
                  mode="aspectFill"
                />
              ))}
            </View>
          )}
          <View className={styles.commentFooter}>
            <View className={styles.commentActions}>
              <View
                className={styles.actionItem}
                onClick={() => handleLikeComment(comment._id)}
              >
                <AtIcon value="heart" size="16" />
                <Text>{comment.likes || 0}</Text>
              </View>
              <View
                className={styles.actionItem}
                onClick={() => handleReplyComment(comment._id)}
              >
                <AtIcon value="message" size="16" />
                <Text>回复</Text>
              </View>
            </View>
            {comment.replies && comment.replies.length > 0 && (
              <Text
                className={styles.showReplies}
                onClick={() => handleShowReplies(comment._id)}
              >
                {`查看${comment.replies.length}条回复`}
              </Text>
            )}
          </View>*/}
        </View>
      </View>
    );
  }, []);

  return (
    <View className={styles.commentSection}>
      <View className={styles.commentTopHeader}>
        <Text className={styles.commentCount}>
          共 {`${formatNumber(comments.length)}`} 条评论
        </Text>
      </View>

      <View className={styles.commentBox}>
        <View className={styles.inputWrapper}>
          <Input
            className={styles.commentInput}
            value={""}
            // onInput={(e) => setCommentText(e.detail.value)}
            onFocus={handleCommentInputFocus}
            onBlur={handleCommentInputBlur}
            placeholder="说点什么..."
            disabled={loading}
          />
        </View>
      </View>

      <ScrollView
        scrollY
        className={styles.commentList}
        onScrollToLower={handleLoadMore}
      >
        {/* {comments.map((comment) => renderCommentItem(comment))} */}
        {commentData.map((comment) => renderCommentItem(comment))}
        {loading && <AtActivityIndicator content="加载中..." color="#f09c20" />}
        {!loading && !hasMore && comments.length > 0 && (
          <View className={styles.loading}>- 没有更多评论了 -</View>
        )}
      </ScrollView>

      {showCommentPanel && (
        <View
          className={styles.mask}
          onClick={() => setShowCommentPanel(false)}
        />
      )}
      <View
        className={`${styles.commentPanelWrapper} ${showCommentPanel ? styles.show : ""}`}
        style={{ bottom: `${keyboardHeight}px` }}
        onClick={(e) => e.stopPropagation()}
      >
        <View className={styles.panelContent}>
          <View className={styles.textareaWrapper}>
            <Input
              type="text"
              maxlength={500}
              value={commentText}
              adjustPosition={false}
              focus={!!showCommentPanel}
              className={styles.textarea}
              placeholder="良言一句三冬暖，恶语伤人律师函..."
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
            <View
              className={`${styles.sendButton} ${commentText.trim() ? styles.active : ""}`}
              onClick={handleSendComment}
            >
              发送
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
