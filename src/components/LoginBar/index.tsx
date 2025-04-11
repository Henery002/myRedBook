import { View, Text } from "@tarojs/components";
import { useCallback, useEffect, useState } from "react";
import Taro from "@tarojs/taro";
import styles from "./index.less";

export default function LoginBar() {
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  let scrollTimer: NodeJS.Timeout | null = null;

  const handleScroll = useCallback(() => {
    if (!isScrolling) {
      setIsScrolling(true);
      setIsVisible(false);
    }

    if (scrollTimer) {
      clearTimeout(scrollTimer);
    }

    scrollTimer = setTimeout(() => {
      setIsScrolling(false);
      setIsVisible(true);
    }, 150);
  }, [isScrolling]);

  useEffect(() => {
    const page = Taro.getCurrentInstance().page;
    if (page) {
      page.onPageScroll = handleScroll;
    }

    return () => {
      if (page) {
        page.onPageScroll = undefined;
      }
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }
    };
  }, [handleScroll]);

  const handleClick = () => {
    Taro.navigateTo({
      url: "/pages/loginPage/index",
    });
  };

  return (
    <View
      className={`${styles.loginBar} ${isVisible ? styles.visible : styles.hidden}`}
      onClick={handleClick}
    >
      <Text className={styles.text}>登录发现更多精彩</Text>
      <Text className={styles.action}>去登录</Text>
    </View>
  );
}
