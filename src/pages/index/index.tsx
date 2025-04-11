import { View } from "@tarojs/components";
import { useDidShow, useDidHide, navigateTo } from "@tarojs/taro";
import { useEffect, useState } from "react";
import { AtActivityIndicator } from "taro-ui";
import { useUserStore, useCloudStore } from "@/store";

// 引入组件
import TabBar from "@/components/TabBar";
import LoginBar from "@/components/LoginBar";
import ListPage from "../ListPage";
import UserPage from "../UserPage";

import styles from "./index.less";

export default function IndexPage() {
  const [activeTab, setActiveTab] = useState(0);
  const { userInfo, checkLoginStatus } = useUserStore();
  const { initialized, initializeCloud } = useCloudStore();
  const [isCheckingLogin, setIsCheckingLogin] = useState(false);

  // 检查登录状态
  const checkAuth = async () => {
    setIsCheckingLogin(true);
    await checkLoginStatus();
    setIsCheckingLogin(false);
  };

  // 每次页面显示时检查登录状态
  useDidShow(() => {
    checkAuth();
  });

  // 初始化云开发
  useEffect(() => {
    if (!initialized) {
      initializeCloud();
    }
  }, [initialized]);

  useDidHide(() => {
    // 清理逻辑
  });

  // 如果正在检查登录状态，可以显示加载状态
  if (isCheckingLogin) {
    return <AtActivityIndicator mode="center" content="加载中..." />;
  }

  console.log(userInfo?._id, "初始化...");

  // 已登录时显示主内容
  return (
    <View className={styles.BasicLayoutWrapper}>
      <View className={styles.mainContentWrapper}>
        {activeTab === 0 ? <ListPage /> : <UserPage />}
      </View>
      {!userInfo?._id && <LoginBar />}
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </View>
  );
}
