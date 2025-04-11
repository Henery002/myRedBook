import { View } from "@tarojs/components";
import { AtTabBar } from "taro-ui";

import styles from "@/pages/index/index.less";

const tabList = [
  {
    title: "首页",
    iconType: "",
  },
  {
    title: "",
    iconType: "add",
  },
  {
    title: "我的",
    iconType: "",
  },
];

export default function TabBar(props) {
  const { activeTab, setActiveTab } = props;

  return (
    <View className={styles.tabBarWrapper}>
      <AtTabBar
        fixed
        color="#666"
        selectedColor="#333"
        tabList={tabList}
        current={activeTab}
        fontSize={16}
        onClick={setActiveTab}
      />
    </View>
  );
}
