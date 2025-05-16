import { View, Text, Image } from "@tarojs/components";
import { useEffect, useState, useCallback } from "react";
import {
  AtIcon,
  AtTabs,
  AtTabsPane,
  AtActivityIndicator,
  AtButton,
} from "taro-ui";
import Taro from "@tarojs/taro";
import { formatLikes } from "@/utils/format";
import { useUserStore } from "@/store";
import { useLoad, usePullDownRefresh, stopPullDownRefresh } from "@tarojs/taro";
import { useUserContentStore } from "@/store/slices/userContent";

import TabBarComponent from "@/components/TabBar";

import styles from "./index.less";
import styles2 from "@/components/PageContent/index.less";

const TAB_LIST = [{ title: "笔记" }, { title: "收藏" }, { title: "赞过" }];

const UserPage = () => {
  const { userInfo, logout } = useUserStore();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentTab, setCurrentTab] = useState<0 | 1 | 2>(0);
  const [activeTab, setActiveTab] = useState(0);

  const {
    userNotes,
    collectedNotes,
    likedNotes,
    receivedLikes,
    receivedCollections,
    loading,
    fetchUserNotes,
    fetchCollectedNotes,
    fetchLikedNotes,
    fetchUserStats,
    refreshAllData,
  } = useUserContentStore();

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

  const handleLogin = () => {
    Taro.navigateTo({
      url: "/pages/loginPage/index",
    });
  };

  useLoad(() => {
    if (userInfo?._id) {
      refreshAllData();
    }
  });

  usePullDownRefresh(async () => {
    if (userInfo?._id) {
      try {
        await refreshAllData();
      } finally {
        stopPullDownRefresh();
      }
    } else {
      stopPullDownRefresh();
    }
  });

  useEffect(() => {
    if (!userInfo?._id) return;

    switch (currentTab) {
      case 0:
        fetchUserNotes(true);
        break;
      case 1:
        fetchCollectedNotes(true);
        break;
      case 2:
        fetchLikedNotes(true);
        break;
    }
  }, [currentTab, userInfo?._id]);

  // 处理点击笔记
  const handleNoteClick = useCallback((noteId: string) => {
    Taro.navigateTo({
      url: `/packageA/pages/detailsPage/index?id=${noteId}`,
    });
  }, []);

  const handleTabChange = (index: number) => {
    if (index === 0) {
      Taro.navigateTo({
        url: "/pages/index/index",
      });
      return;
    }
    if (index === 1) {
      Taro.navigateTo({
        url: `${userInfo?._id ? "/pages/publishPage/index" : "/pages/userPage/index"}`,
      });
      return;
    }
    setActiveTab(index);
  };

  const renderContent = () => {
    const notes =
      currentTab === 0
        ? userNotes
        : currentTab === 1
          ? collectedNotes
          : likedNotes;
    const isLoading =
      loading[
        currentTab === 0 ? "notes" : currentTab === 1 ? "collected" : "liked"
      ];

    if (isLoading && notes.length === 0) {
      return <AtActivityIndicator mode="center" color="#f09c20" />;
    }

    if (!userInfo?._id) {
      return (
        <View className={styles.emptyState}>
          <Image
            className={styles.emptyIcon}
            src="/assets/images/empty-notes.png"
            mode="aspectFit"
          />
          <Text className={styles.emptyText}>
            登录可以查看发布、点赞、收藏的笔记内容
          </Text>
          <AtButton
            size="small"
            circle
            className={styles.loginBtn}
            onClick={handleLogin}
          >
            点击登录
          </AtButton>
        </View>
      );
    }

    if (notes.length === 0) {
      return (
        <View className={styles.emptyState}>
          <Image
            className={styles.emptyIcon}
            src="/assets/images/empty-notes.png"
            mode="aspectFit"
          />
          <Text className={styles.emptyText}>你还没有发布笔记哦</Text>
        </View>
      );
    }

    return (
      <View className={styles2.waterfallWrapper}>
        <View className={styles2.column}>
          {notes
            .filter((_, i) => i % 2 === 0)
            .map((note) => (
              <View
                key={note._id}
                className={styles2.card}
                onClick={() => handleNoteClick(note._id)}
              >
                <View className={styles2.cover}>
                  <Image src={note.images?.[0]} mode="widthFix" lazyLoad />
                </View>
                <View className={styles2.content}>
                  <View className={styles2.title}>{note.title}</View>
                  <View className={styles2.userInfo}>
                    <View className={styles2.userInfoItem}>
                      <Image src={note.author.avatarUrl} mode="aspectFill" />
                      <View className={styles2.userName}>
                        {note.author?.nickname || note.author?.phone}
                      </View>
                    </View>
                    <View className={styles2.actionItem}>
                      <AtIcon color="#999" value="heart" size="16" />
                      <View className={styles2.likes}>{note.likes}</View>
                    </View>
                  </View>
                </View>
              </View>
            ))}
        </View>
        <View className={styles2.column}>
          {notes
            .filter((_, i) => i % 2 === 1)
            .map((note) => (
              <View
                key={note._id}
                className={styles2.card}
                onClick={() => handleNoteClick(note._id)}
              >
                <View className={styles2.cover}>
                  <Image src={note.images?.[0]} mode="widthFix" lazyLoad />
                </View>
                <View className={styles2.content}>
                  <View className={styles2.title}>{note.title}</View>
                  <View className={styles2.userInfo}>
                    <View className={styles2.userInfoItem}>
                      <Image src={note.author.avatarUrl} mode="aspectFill" />
                      <View className={styles2.userName}>
                        {note.author?.nickname || note.author?.phone}
                      </View>
                    </View>
                    <View className={styles2.actionItem}>
                      <AtIcon color="#999" value="heart" size="16" />
                      <View className={styles2.likes}>{note.likes}</View>
                    </View>
                  </View>
                </View>
              </View>
            ))}
        </View>
      </View>
    );
  };

  return (
    <View className={styles.userPageWrapper}>
      <View className={styles.userPage}>
        <View className={styles.userHeader}>
          <View className={styles.userInfo}>
            <Image
              mode="aspectFill"
              className={styles.avatar}
              src={userInfo?.avatarUrl || ""}
            />
            {userInfo?._id && (
              <View className={styles.userMeta}>
                <Text className={styles.nickname}>
                  {userInfo?.nickname || "未知"}
                </Text>
                <View className={styles.extraInfo}>
                  <Text className={styles.sex}>
                    性别:{" "}
                    {userInfo?.gender === 1
                      ? "男"
                      : userInfo?.gender === 2
                        ? "女"
                        : "未知"}
                  </Text>
                  <Text className={styles.ip}>
                    IP: {userInfo?.ip || "未知"}
                  </Text>
                </View>
              </View>
            )}
          </View>
          <View className={styles.settingBtn} onClick={handleSettingClick}>
            <AtIcon value="settings" size="24" color="#fff" />
          </View>
        </View>

        {userInfo?._id && (
          <View className={styles.bioSection}>
            <Text className={styles.bioText}>
              {userInfo?.bio || "还没有简介"}
            </Text>
          </View>
        )}

        <View className={styles.statsSection}>
          <View className={styles.statsItem}>
            <Text className={styles.statsNum}>
              {userInfo?._id ? formatLikes(userInfo?.followingCount || 0) : 0}
            </Text>
            <Text className={styles.statsLabel}>关注</Text>
          </View>
          <View className={styles.statsItem}>
            <Text className={styles.statsNum}>
              {userInfo?._id ? formatLikes(userInfo?.followersCount || 0) : 0}
            </Text>
            <Text className={styles.statsLabel}>粉丝</Text>
          </View>
          <View className={styles.statsItem}>
            <Text className={styles.statsNum}>
              {userInfo?._id ? formatLikes(userInfo?.likesCount || 0) : 0}
            </Text>
            <Text className={styles.statsLabel}>获赞与收藏</Text>
          </View>
        </View>

        <View className={styles.contentTabs}>
          <AtTabs
            current={currentTab}
            tabList={TAB_LIST}
            animated={false}
            onClick={(v: number) => setCurrentTab(v as 0 | 1 | 2)}
          >
            {TAB_LIST.map((_, index) => (
              <AtTabsPane current={currentTab} index={index} key={index}>
                {renderContent()}
              </AtTabsPane>
            ))}
          </AtTabs>
        </View>

        {isModalVisible && (
          <View className={styles.modalOverlay} onClick={handleModalClose}>
            <View
              className={`${styles.modalContent} ${isAnimating ? styles.fadeOut : styles.fadeIn}`}
              onClick={(e) => e.stopPropagation()}
            >
              <View
                className={styles.modalOption}
                onClick={handleSwitchAccount}
              >
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

      <TabBarComponent
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        userInfo={userInfo}
      />
    </View>
  );
};

export default UserPage;
