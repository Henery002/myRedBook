import { View } from "@tarojs/components";
import { useDidShow, useDidHide, navigateTo } from "@tarojs/taro";
import { useEffect, useState } from "react";
import { AtActivityIndicator } from "taro-ui";
import { useUserStore, useCloudStore } from "@/store";

// 引入组件
import ListPage from "../ListPage";
import UserPage from "../UserPage";
import TabBar from "@/components/TabBar";
import LoginPage from "../LoginPage";

import styles from "./index.less";

export default function IndexPage() {
  const [activeTab, setActiveTab] = useState(0);
  const { userInfo, checkLoginStatus } = useUserStore();
  const { initialized, initializeCloud } = useCloudStore();
  const [isCheckingLogin, setIsCheckingLogin] = useState(true);

  // 检查登录状态
  const checkAuth = async () => {
    setIsCheckingLogin(true);
    await checkLoginStatus();
    setIsCheckingLogin(false);
  };

  // 每次页面显示时检查登录状态
  useDidShow(() => {
    // checkAuth();
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
    // return <AtActivityIndicator mode="center" content="加载中..." />;
  }

  // 未登录时显示登录页
  if (!userInfo) {
    return <LoginPage />;
  }

  console.log(userInfo, "初始化...");

  // 已登录时显示主内容
  return (
    <View className={styles.BasicLayoutWrapper}>
      <View className={styles.content}>
        {activeTab === 0 ? <ListPage /> : <UserPage />}
      </View>
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </View>
  );
}
