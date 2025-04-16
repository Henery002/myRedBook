import { View } from "@tarojs/components";
import { AtTabBar } from "taro-ui";
import styles from "./index.less";

interface Props {
  activeTab: number;
  setActiveTab: (index: number) => void;
  userInfo: any;
}

const tablist = [
  {
    title: "首页",
    iconType: "", //"home",
  },
  {
    title: "",
    iconType: "add",
  },
  {
    title: "我的",
    iconType: "", //"user",
  },
];

const TabBarComponent: React.FC<Props> = (props) => {
  const { activeTab, setActiveTab, userInfo } = props;

  return (
    <View className={styles.tabBar}>
      <AtTabBar
        fixed
        color="#666"
        selectedColor="#f09c20"
        tabList={tablist.filter((v) => (userInfo?._id ? true : !!v.title))}
        current={activeTab}
        fontSize={16}
        onClick={setActiveTab}
      />
    </View>
  );
};

export default TabBarComponent;
