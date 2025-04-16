import { View } from "@tarojs/components";
import { AtTabBar } from "taro-ui";
import "./index.less";

interface Props {
  activeTab: number;
  setActiveTab: (index: number) => void;
}

const tablist = [
  {
    title: "首页",
    iconType: "home",
  },
  {
    title: "发布",
    iconType: "add",
  },
  {
    title: "我的",
    iconType: "user",
  },
];

const TabBarComponent: React.FC<Props> = (props) => {
  const { activeTab, setActiveTab } = props;

  return (
    <View className="tab-bar">
      <AtTabBar
        fixed
        color="#666"
        selectedColor="#f09c20"
        tabList={tablist}
        current={activeTab}
        fontSize={16}
        onClick={setActiveTab}
      />
    </View>
  );
};

export default TabBarComponent;
