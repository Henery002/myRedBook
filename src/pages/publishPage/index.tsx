import { View, Text, Image, Input, Textarea } from "@tarojs/components";
import { AtIcon, AtButton } from "taro-ui";
import Taro from "@tarojs/taro";
import { useUserStore } from "@/store";
import { getDB } from "@/services/cloud";
import { useState, useCallback } from "react";

import styles from "./index.less";

const MAX_IMAGE_COUNT = 9;

interface LocationType {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export default function PublishPage() {
  const { userInfo } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState<LocationType | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const handleBack = useCallback(() => {
    Taro.navigateBack();
  }, []);

  const handleChooseImage = useCallback(() => {
    if (images.length >= MAX_IMAGE_COUNT) {
      Taro.showToast({ title: "最多上传9张图片", icon: "none" });
      return;
    }

    Taro.chooseImage({
      count: MAX_IMAGE_COUNT - images.length,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
      success: async (res) => {
        setLoading(true);
        const tempFilePaths = res.tempFilePaths;
        const uploadTasks = tempFilePaths.map(async (path) => {
          try {
            const uploadRes = await Taro.cloud.uploadFile({
              cloudPath: `notes/${Date.now()}-${Math.random().toString(36).slice(2)}.${path.split(".").pop()}`,
              filePath: path,
            });
            return uploadRes.fileID;
          } catch (error) {
            console.error("Upload failed:", error);
            return null;
          }
        });

        try {
          const uploadedFiles = await Promise.all(uploadTasks);
          const validFiles = uploadedFiles.filter(Boolean) as string[];
          setImages((prev) => [...prev, ...validFiles]);
        } catch (error) {
          Taro.showToast({ title: "上传图片失败", icon: "none" });
        } finally {
          setLoading(false);
        }
      },
    });
  }, [images]);

  const handleDeleteImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleChooseLocation = useCallback(() => {
    Taro.chooseLocation({
      success: (res) => {
        setLocation({
          name: res.name,
          address: res.address,
          latitude: res.latitude,
          longitude: res.longitude,
        });
      },
      fail: (err) => {
        console.error("选择位置失败:", err);
        // 检查是否是因为用户未授权
        if (err.errMsg.includes("auth deny")) {
          Taro.showModal({
            title: "提示",
            content: "需要您授权使用位置信息",
            confirmText: "去设置",
            success: (modalRes) => {
              if (modalRes.confirm) {
                Taro.openSetting();
              }
            },
          });
        } else {
          Taro.showToast({
            title: "选择位置失败",
            icon: "none",
          });
        }
      },
    });
  }, []);

  const handlePublish = useCallback(async () => {
    if (!title.trim()) {
      Taro.showToast({ title: "请输入标题", icon: "none" });
      return;
    }

    if (!content.trim()) {
      Taro.showToast({ title: "请输入内容", icon: "none" });
      return;
    }

    if (images.length === 0) {
      Taro.showToast({ title: "请至少上传一张图片", icon: "none" });
      return;
    }

    setIsPublishing(true);

    try {
      const db = getDB();
      await db.collection("notes").add({
        data: {
          title: title.trim(),
          content: content.trim(),
          images,
          location: location
            ? {
                name: location.name,
                address: location.address,
                latitude: location.latitude,
                longitude: location.longitude,
              }
            : null,
          author: {
            _id: userInfo?._id,
            phone: userInfo?.phone,
          },
          createTime: db.serverDate(),
          updateTime: db.serverDate(),
          likes: 0,
          comments: 0,
          collections: 0,
        },
      });

      Taro.showToast({
        title: "发布成功",
        icon: "none",
      });

      setTimeout(() => {
        Taro.reLaunch({
          url: "/pages/index/index",
        });
      }, 1500);
    } catch (error) {
      console.error("发布失败:", error);
      Taro.showToast({
        title: "发布失败，请重试",
        icon: "none",
      });
    } finally {
      setIsPublishing(false);
    }
  }, [title, content, images, location, userInfo]);

  const handleSaveDraft = useCallback(() => {
    Taro.showToast({
      title: "已保存到草稿箱",
      icon: "success",
    });
  }, []);

  return (
    <View className={styles.publishPage}>
      {/* <View className={styles.backIcon} onClick={handleBack}>
        <AtIcon value="chevron-left" size="24" />
      </View> */}

      <View className={styles.imageUploadSection}>
        {images.map((image, index) => (
          <View key={image} className={styles.imageItem}>
            <Image
              className={styles.previewImage}
              src={image}
              mode="aspectFill"
            />
            <View
              className={styles.deleteBtn}
              onClick={() => handleDeleteImage(index)}
            >
              <AtIcon value="close" size="16" color="#fff" />
            </View>
          </View>
        ))}
        {images.length < MAX_IMAGE_COUNT && (
          <View className={styles.uploadBtn} onClick={handleChooseImage}>
            <AtIcon value="add" size="24" color="#999" />
          </View>
        )}
      </View>

      {loading && <View className={styles.loadingText}>加载中...</View>}

      <View className={styles.formSection}>
        <Input
          className={styles.titleInput}
          placeholder="添加标题"
          value={title}
          onInput={(e) => setTitle(e.detail.value)}
        />
        <Textarea
          className={styles.contentInput}
          placeholder="添加正文"
          value={content}
          onInput={(e) => setContent(e.detail.value)}
        />
      </View>

      {/*
      <View className={styles.toolsSection}>
        <View className={styles.toolItem}>
          <AtIcon value="streaming" size="14" color="#999" />
          <Text>话题</Text>
        </View>
        <View className={styles.toolItem}>
          <AtIcon value="tag" size="14" color="#999" />
          <Text>用户</Text>
        </View>
        <View className={styles.toolItem}>
          <AtIcon value="message" size="14" color="#999" />
          <Text>投票</Text>
        </View>
        <View className={styles.toolItem}>
          <AtIcon value="chevron-up" size="14" color="#999" />
          <Text>长文</Text>
        </View>
      </View> */}

      <View className={styles.locationSection} onClick={handleChooseLocation}>
        <View className={styles.locationHeader}>
          <View className={styles.leftText}>
            <AtIcon value="map-pin" size="16" color="#333" />
            <Text>标记地点</Text>
          </View>
          <View className={styles.rightText}>
            <Text>{location ? location.name : "标记位置让更多人看到"}</Text>
            <AtIcon value="chevron-right" size="16" color="#999" />
          </View>
        </View>
        {location && (
          <View className={styles.locationDetail}>
            <Text className={styles.locationAddress}>{location.address}</Text>
          </View>
        )}
        {/*
        <View className={styles.locationTags}>
          <Text className={styles.locationTag}>万达广场(南京六)</Text>
          <Text className={styles.locationTag}>龙池湖</Text>
          <Text className={styles.locationTag}>时代广场</Text>
          <Text className={styles.locationTag}>龙池</Text>
          <Text className={styles.locationTag}>龙港乐园</Text>
        </View>
        */}
      </View>

      <View className={styles.visibilitySection}>
        <View className={styles.leftText}>
          <AtIcon value="lock" size="16" color="#333" />
          <Text>公开可见</Text>
        </View>
        <View className={styles.rightText}>
          <AtIcon value="chevron-right" size="16" color="#999" />
        </View>
      </View>

      <View className={styles.bottomToolbar}>
        <View>
          <AtButton
            circle
            type="primary"
            loading={isPublishing}
            disabled={isPublishing}
            onClick={handlePublish}
            className={`${styles.publishBtn} ${isPublishing ? styles.publishing : ""}`}
          >
            发布笔记
          </AtButton>
        </View>
        <View className={styles.rightTools}>
          <View className={styles.draftBtn} onClick={handleSaveDraft}>
            <AtIcon value="credit-card" size="18" color="#666" />
            <Text>存草稿</Text>
          </View>
          <View className={styles.previewBtn}>
            <AtIcon value="eye" size="18" color="#666" />
            <Text>预览</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
