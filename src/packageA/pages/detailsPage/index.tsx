import { View, Text, Image, Swiper, SwiperItem } from "@tarojs/components";
import { useEffect, useState } from "react";
import { AtIcon, AtActivityIndicator } from "taro-ui";
import Taro from "@tarojs/taro";
import { useUserStore, useNoteStore } from "@/store";
import { formatTime, formatLikes } from "@/utils/format";
import CommentSection from "@/components/CommentSection";
import ImagePreview from "@/components/ImagePreview";
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
  const [previewVisible, setPreviewVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  // 轮播图配置
  const swiperConfig = {
    current: 0,
    autoplay: false,
    interval: 3000,
    duration: 500,
    circular: true,
    indicatorDots: true,
    indicatorColor: "rgba(255, 255, 255, 0.6)",
    indicatorActiveColor: "#ffffff",
  };

  // 处理图片点击
  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setPreviewVisible(true);
  };

  // 处理预览关闭
  const handlePreviewClose = () => {
    setPreviewVisible(false);
  };

  if (loading || !currentNote) {
    return (
      <View className={styles.loading}>
        <AtActivityIndicator
          mode="center"
          content="加载中..."
          color="#f09c20"
        />
      </View>
    );
  }

  // console.log(loading, currentNote, "detailsPage...");

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
          <View className={styles.mainImage}>
            {currentNote?.images?.length && (
              <Swiper {...swiperConfig} className={styles.swiperWrapper}>
                {currentNote.images.map((image, index) => (
                  <SwiperItem key={index}>
                    <Image
                      className={styles.imageItem}
                      src={image}
                      mode="aspectFit"
                      onClick={() => handleImageClick(index)}
                    />
                  </SwiperItem>
                ))}
              </Swiper>
            )}
          </View>
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
              <Text>{currentNote?.location?.name || "未知"}</Text>
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

      {/* 图片预览组件 */}
      {currentNote.images && (
        <ImagePreview
          images={currentNote.images}
          current={currentImageIndex}
          visible={previewVisible}
          onClose={handlePreviewClose}
        />
      )}

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
