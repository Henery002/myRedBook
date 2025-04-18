import { View, Text, Image } from "@tarojs/components";
import { useEffect, useState } from "react";
import { AtIcon } from "taro-ui";
import Taro from "@tarojs/taro";
import { useUserStore } from "@/store";
import styles from "./index.less";

const UserPage = () => {
  const { userInfo, logout } = useUserStore();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSettingClick = () => {
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsModalVisible(false);
      setIsAnimating(false);
    }, 300);
  };

  const handleSwitchAccount = () => {
    handleModalClose();
    setTimeout(() => {
      Taro.navigateTo({
        url: "/pages/loginPage/index",
      });
    }, 300);
  };

  const handleLogout = async () => {
    setIsAnimating(true);
    // 添加过渡动画
    setTimeout(async () => {
      await logout();
      handleModalClose();
      // 重定向到首页
      Taro.reLaunch({
        url: "/pages/index/index",
      });
    }, 300);
  };

  return (
    <View className={styles.userPageWrapper}>
      {/* 顶部用户信息 */}
      <View className={styles.userHeader}>
        <View className={styles.userInfo}>
          <Image
            mode="aspectFill"
            className={styles.avatar}
            src={userInfo?.avatarUrl || "https://placeholder.com/150"}
          />
          <View className={styles.userMeta}>
            <Text className={styles.nickname}>{userInfo?.nickname}</Text>
            <Text className={styles.redBookId}>小黄书id 11881124302</Text>
          </View>
        </View>
        <View className={styles.settingBtn} onClick={handleSettingClick}>
          <AtIcon value="settings" size="24" color="#333" />
        </View>
      </View>

      {/* 简介 */}
      <View className={styles.bioSection}>
        <Text className={styles.bioText}>还没有简介</Text>
      </View>

      {/* 统计数据 */}
      <View className={styles.statsSection}>
        <View className={styles.statsItem}>
          <Text className={styles.statsNum}>4</Text>
          <Text className={styles.statsLabel}>关注</Text>
        </View>
        <View className={styles.statsItem}>
          <Text className={styles.statsNum}>0</Text>
          <Text className={styles.statsLabel}>粉丝</Text>
        </View>
        <View className={styles.statsItem}>
          <Text className={styles.statsNum}>0</Text>
          <Text className={styles.statsLabel}>获赞与收藏</Text>
        </View>
      </View>

      {/* 内容标签页 */}
      <View className={styles.contentTabs}>
        <View className={styles.tabItem}>
          <Text className={`${styles.tabText} ${styles.active}`}>笔记</Text>
          <View className={styles.tabLine} />
        </View>
        <View className={styles.tabItem}>
          <Text className={styles.tabText}>收藏</Text>
        </View>
        <View className={styles.tabItem}>
          <Text className={styles.tabText}>赞过</Text>
        </View>
      </View>

      {/* 空状态 */}
      <View className={styles.emptyState}>
        <Image
          className={styles.emptyIcon}
          src="/assets/images/empty-notes.png"
          mode="aspectFit"
        />
        <Text className={styles.emptyText}>你还没有发布笔记哦</Text>
      </View>

      {/* 设置弹框 */}
      {isModalVisible && (
        <View className={styles.modalOverlay} onClick={handleModalClose}>
          <View
            className={`${styles.modalContent} ${isAnimating ? styles.fadeOut : styles.fadeIn}`}
            onClick={(e) => e.stopPropagation()}
          >
            <View className={styles.modalOption} onClick={handleSwitchAccount}>
              <Text className={styles.optionText}>切换账号</Text>
            </View>
            <View
              className={`${styles.modalOption} ${styles.danger}`}
              onClick={handleLogout}
            >
              <Text className={`${styles.optionText} ${styles.dangerText}`}>
                退出登录
              </Text>
            </View>
            <View className={styles.modalCancel} onClick={handleModalClose}>
              <Text className={styles.cancelText}>取消</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default UserPage;
