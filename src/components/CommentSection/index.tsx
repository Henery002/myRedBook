import { useState, useEffect, useCallback } from "react";
import { View, Text, Image, Input, ScrollView } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { AtIcon } from "taro-ui";
import "./index.less";

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

export default function CommentSection({ noteId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const fetchComments = useCallback(
    async (pageNum: number = 1, refresh: boolean = false) => {
      try {
        setLoading(true);
        const res = await Taro.cloud.callFunction({
          name: "getComments",
          data: {
            noteId,
            page: pageNum.toString(),
            pageSize: PAGE_SIZE.toString(),
          },
        });

        const { data, hasMore } = res.result as {
          data: Comment[];
          hasMore: boolean;
        };
        setComments((prev) => (refresh ? data : [...prev, ...data]));
        setHasMore(hasMore);
        setPage(pageNum);
      } catch (error) {
        Taro.showToast({
          title: "加载评论失败",
          icon: "none",
        });
      } finally {
        setLoading(false);
      }
    },
    [noteId],
  );

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchComments(page + 1);
    }
  }, [loading, hasMore, page, fetchComments]);

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

  const handleSubmitComment = useCallback(async () => {
    if (!commentText.trim() && selectedImages.length === 0) {
      Taro.showToast({
        title: "请输入评论内容或选择图片",
        icon: "none",
      });
      return;
    }

    try {
      setLoading(true);
      let uploadedImages: string[] = [];

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

      await Taro.cloud.callFunction({
        name: "addComment",
        data: {
          noteId,
          content: commentText,
          images: uploadedImages,
        },
      });

      setCommentText("");
      setSelectedImages([]);
      setShowEmojiPanel(false);
      fetchComments(1, true);

      Taro.showToast({
        title: "评论成功",
        icon: "success",
      });
    } catch (error) {
      Taro.showToast({
        title: "评论失败",
        icon: "none",
      });
    } finally {
      setLoading(false);
    }
  }, [commentText, selectedImages, noteId, fetchComments]);

  const renderCommentItem = useCallback(
    (comment: Comment, isReply: boolean = false) => {
      return (
        <View
          key={comment._id}
          className={`commentItem ${isReply ? "replyItem" : ""}`}
        >
          <Image className="avatar" src={comment.avatar} />
          <View className="commentContent">
            <View className="commentHeader">
              <Text className="nickname">{comment.nickname}</Text>
              <Text className="time">{comment.createTime}</Text>
            </View>
            <View className="commentText">{comment.content}</View>
            {comment.images && comment.images.length > 0 && (
              <View className="imageList">
                {comment.images.map((image, index) => (
                  <Image
                    key={index}
                    className="commentImage"
                    src={image}
                    onClick={() => {
                      Taro.previewImage({
                        current: image,
                        urls: comment.images || [],
                      });
                    }}
                  />
                ))}
              </View>
            )}
            <View className="commentFooter">
              <View className="commentActions">
                <View
                  className="actionItem"
                  onClick={() => handleLikeComment(comment._id)}
                >
                  <AtIcon
                    value={comment.isLiked ? "heart-2" : "heart"}
                    size="16"
                    color={comment.isLiked ? "#ff4757" : "#999"}
                  />
                  <Text>{comment.likes}</Text>
                </View>
                <View
                  className="actionItem"
                  onClick={() => handleReplyComment(comment._id)}
                >
                  <AtIcon value="message" size="16" />
                  <Text>回复</Text>
                </View>
              </View>
              {comment.replies && comment.replies.length > 0 && (
                <Text
                  className="showReplies"
                  onClick={() => handleShowReplies(comment._id)}
                >
                  {`查看${comment.replies.length}条回复`}
                </Text>
              )}
            </View>
            {comment.replies && comment.replies.length > 0 && (
              <View className="replyList">
                {comment.replies.map((reply) => renderCommentItem(reply, true))}
              </View>
            )}
          </View>
        </View>
      );
    },
    [],
  );

  const handleLikeComment = useCallback(
    async (commentId: string) => {
      try {
        await Taro.cloud.callFunction({
          name: "likeComment",
          data: { commentId },
        });
        fetchComments(1, true);
      } catch (error) {
        Taro.showToast({
          title: "操作失败",
          icon: "none",
        });
      }
    },
    [fetchComments],
  );

  const handleReplyComment = useCallback((commentId: string) => {
    // 在这里实现回复逻辑
  }, []);

  const handleShowReplies = useCallback((commentId: string) => {
    // 在这里实现展示回复列表的逻辑
  }, []);

  return (
    <View className="commentSection">
      <View className="commentHeader">
        <Text className="commentCount">{`${comments.length}条评论`}</Text>
      </View>

      <ScrollView
        className="commentList"
        scrollY
        onScrollToLower={handleLoadMore}
      >
        {comments.map((comment) => renderCommentItem(comment))}
        {loading && <View className="loading">加载中...</View>}
        {!loading && !hasMore && comments.length > 0 && (
          <View className="loading">没有更多评论了</View>
        )}
      </ScrollView>

      <View className="commentBox">
        <View className="inputWrapper">
          <Input
            className="commentInput"
            value={commentText}
            onInput={(e) => setCommentText(e.detail.value)}
            placeholder="说点什么..."
            disabled={loading}
          />
          <View className="inputActions">
            <View className="actionItem" onClick={handleChooseImage}>
              <AtIcon value="image" size="20" />
            </View>
            <View
              className="actionItem"
              onClick={() => setShowEmojiPanel(!showEmojiPanel)}
            >
              <AtIcon value="emoji" size="20" />
            </View>
          </View>
        </View>

        {selectedImages.length > 0 && (
          <View className="selectedImages">
            {selectedImages.map((image, index) => (
              <View key={index} className="imageItem">
                <Image className="preview" src={image} />
                <View
                  className="deleteBtn"
                  onClick={() => handleDeleteImage(index)}
                >
                  <AtIcon value="close" size="12" color="#fff" />
                </View>
              </View>
            ))}
          </View>
        )}

        {showEmojiPanel && (
          <View className="emojiPanel">{/* 在这里实现表情面板 */}</View>
        )}
      </View>
    </View>
  );
}
