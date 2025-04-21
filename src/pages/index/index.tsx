import { View } from "@tarojs/components";
import { useDidShow, useDidHide } from "@tarojs/taro";
import { useState } from "react";
import Taro from "@tarojs/taro";
import { AtActivityIndicator } from "taro-ui";
import { useUserStore } from "@/store";

// 引入组件
import TabBarComponent from "@/components/TabBar";
import LoginBar from "@/components/LoginBar";
import HomeContent from "@/components/PageContent/HomeContent";

import styles from "./index.less";

function IndexPage() {
  const { userInfo, checkLoginStatus } = useUserStore();
  const [isCheckingLogin, setIsCheckingLogin] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // 检查登录状态
  const checkAuth = async () => {
    setIsCheckingLogin(true);
    await checkLoginStatus();
    setIsCheckingLogin(false);
  };

  // 每次页面显示时检查登录状态
  useDidShow(() => {
    checkAuth();
    setActiveTab(0);
  });

  useDidHide(() => {
    // 清理逻辑
  });

  // 如果正在检查登录状态，可以显示加载状态
  if (isCheckingLogin) {
    return <AtActivityIndicator mode="center" content="" color="#f09c20" />;
  }

  // 处理标签页切换
  const handleTabChange = (index: number) => {
    if (index === 1) {
      Taro.navigateTo({
        url: `${userInfo?._id ? "/pages/publishPage/index" : "/pages/userPage/index"}`,
      });
      return;
    }
    if (index === 2) {
      Taro.navigateTo({
        url: "/pages/userPage/index",
      });
      return;
    }
    setActiveTab(index);
  };

  // 已登录时显示主内容
  return (
    <View className={styles.BasicLayoutWrapper}>
      <View className={styles.mainContentWrapper}>
        <HomeContent />
      </View>
      {!userInfo?._id && <LoginBar />}
      <TabBarComponent
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        userInfo={userInfo}
      />
    </View>
  );
}

export default IndexPage;
