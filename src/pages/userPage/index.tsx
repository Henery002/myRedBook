import { View } from "@tarojs/components";
import { useEffect } from "react";
import { useUserStore } from "@/store";
import styles from "@/pages/index/index.less";

const UserPage = () => {
  const { userInfo } = useUserStore();

  useEffect(() => {
    // 用户页面初始化逻辑
  }, []);

  return (
    <View className={styles.userPageWrapper}>
      {/* 用户信息展示 */}
      <View>
        {userInfo ? (
          <View>用户信息: {userInfo.nickName}</View>
        ) : (
          <View>未登录</View>
        )}
      </View>
    </View>
  );
};

export default UserPage;
