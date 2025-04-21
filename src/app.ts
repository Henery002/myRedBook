import { useDidShow, useDidHide } from "@tarojs/taro";
import { type PropsWithChildren, useEffect } from "react";
import { useCloudStore } from "@/store";

import "taro-ui/dist/style/index.scss";
import "./styles/custom-tabs.less";
import "./app.less";

const App = (props: PropsWithChildren) => {
  const { initialized, initializeCloud } = useCloudStore();

  useEffect(() => {
    //
  }, []);

  useDidShow(() => {
    // 初始化逻辑
    if (!initialized) {
      initializeCloud();
    }
  });

  useDidHide(() => {
    // 清理逻辑
  });

  return props.children;
};

export default App;
