import { View, Text } from "@tarojs/components";
import { useCallback, useEffect, useState } from "react";
import { AtIcon } from "taro-ui";
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
      url: "/packageB/pages/loginPage/index",
    });
  };

  return (
    <View
      className={`${styles.loginBar} ${isVisible ? styles.visible : styles.hidden}`}
      onClick={handleClick}
    >
      <View className={styles.left}>
        <AtIcon value="user" size="18" color="#333" />
        <Text className={styles.text}>登录发现更多精彩</Text>
      </View>
      <Text className={styles.action}>去登录</Text>
    </View>
  );
}
