import { View } from "@tarojs/components";
import { useDidShow, useDidHide } from "@tarojs/taro";
import { useState, useRef } from "react";
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
  const isFirstRender = useRef(true);
  const isFromDetails = useRef(false);

  // 检查登录状态
  const checkAuth = async () => {
    setIsCheckingLogin(true);
    await checkLoginStatus();
    setIsCheckingLogin(false);
  };

  // 每次页面显示时检查登录状态
  useDidShow(() => {
    // 首次加载时执行完整的登录检查和数据加载
    if (isFirstRender.current) {
      checkAuth();
      isFirstRender.current = false;
    } else if (isFromDetails.current) {
      // 从详情页返回时，只检查登录状态，不触发完整的数据重新加载
      checkLoginStatus();
      isFromDetails.current = false;
    } else {
      // 其他情况（如从其他页面返回），执行完整的登录检查
      checkAuth();
    }
    setActiveTab(0);
  });

  useDidHide(() => {
    // 记录是否从详情页返回
    const pages = Taro.getCurrentPages();
    if (pages.length > 1) {
      const prevPage = pages[pages.length - 2];
      isFromDetails.current = prevPage.route.includes("detailsPage");
    }
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
