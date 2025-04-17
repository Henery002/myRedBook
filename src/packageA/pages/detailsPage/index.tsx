import { View, Text, Image } from "@tarojs/components";
import { useEffect, useState } from "react";
import { AtIcon, AtActivityIndicator } from "taro-ui";
import Taro from "@tarojs/taro";
import { useUserStore, useNoteStore } from "@/store";
import { formatTime, formatLikes } from "@/utils/format";
import CommentSection from "@/components/CommentSection";
import styles from "./index.less";

const DetailsPage = () => {
  const { userInfo } = useUserStore();
  const {
    currentNote,
    loading,
    fetchNoteDetail,
    likeNote,
    collectNote,
    resetCurrentNote,
  } = useNoteStore();
  const [noteId, setNoteId] = useState<string>("");

  useEffect(() => {
    // 从路由参数中获取 noteId
    const params = Taro.getCurrentInstance().router?.params;
    if (params?.id) {
      setNoteId(params.id);
      fetchNoteDetail(params.id);
    }

    // 页面卸载时重置当前笔记
    return () => {
      resetCurrentNote();
    };
  }, [fetchNoteDetail, resetCurrentNote]);

  const handleLike = () => {
    if (noteId) {
      likeNote(noteId);
    }
  };

  const handleCollect = () => {
    if (noteId) {
      collectNote(noteId);
    }
  };

  const handleShare = () => {
    Taro.showShareMenu({
      withShareTicket: true,
    });
  };

  const handleLogin = () => {
    Taro.navigateTo({
      url: "/pages/loginPage/index",
    });
  };

  if (loading || !currentNote) {
    return (
      <View className={styles.loading}>
        <AtActivityIndicator mode="center" content="加载中..." />
      </View>
    );
  }

  console.log(loading, currentNote, "detailsPage...");

  return (
    <View className={styles.detailsWrapper}>
      <View className={styles.content}>
        <View className={styles.header}>
          <View className={styles.userInfo}>
            <Image
              className={styles.avatar}
              src={currentNote.author.avatarUrl}
              mode="aspectFill"
            />
            <View className={styles.meta}>
              <Text className={styles.nickname}>
                {currentNote.author.nickname}
              </Text>
            </View>
          </View>
          <View className={styles.followBtn}>
            <Text className={styles.followText}>关注</Text>
          </View>
        </View>

        <View className={styles.mainContent}>
          {currentNote.images?.[0] && (
            <Image
              className={styles.mainImage}
              src={currentNote.images[0]}
              mode="widthFix"
            />
          )}
          <View className={styles.title}>
            <Text>{currentNote.title}</Text>
          </View>
          <View className={styles.description}>
            <Text>{currentNote.content}</Text>
          </View>
          <View className={styles.time}>
            <View className={styles.timeItem}>
              <AtIcon value="clock" size="14" color="#999" />
              <Text>{formatTime(currentNote.createTime)}</Text>
            </View>
            <View className={styles.timeItem}>
              <AtIcon value="map-pin" size="14" color="#999" />
              {currentNote.location && (
                <Text className={styles.address}>
                  {currentNote.location?.name}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View className={styles.interactions}>
          <View className={styles.interactionItem} onClick={handleLike}>
            <AtIcon
              value={currentNote.isLiked ? "heart-2" : "heart"}
              size="18"
              color={currentNote.isLiked ? "#ff2442" : "#666"}
            />
            <Text className={styles.count}>
              {formatLikes(currentNote.likes)}
            </Text>
          </View>
          <View className={styles.interactionItem} onClick={handleCollect}>
            <AtIcon
              value={currentNote.isCollected ? "star-2" : "star"}
              size="18"
              color={currentNote.isCollected ? "#ff2442" : "#666"}
            />
            <Text className={styles.count}>
              {formatLikes(currentNote.collections)}
            </Text>
          </View>
          <View className={styles.interactionItem} onClick={handleShare}>
            <AtIcon value="share" size="18" color="#666" />
            <Text className={styles.count}>分享</Text>
          </View>
        </View>
      </View>

      {/* 评论区 */}
      {!userInfo?._id ? (
        <View className={styles.loginPrompt} onClick={handleLogin}>
          <View className={styles.loginText}>登录后查看评论</View>
        </View>
      ) : (
        noteId && <CommentSection noteId={noteId} />
      )}
    </View>
  );
};

export default DetailsPage;
