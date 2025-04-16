import { useDidShow, useDidHide } from "@tarojs/taro";
import { type PropsWithChildren, useEffect } from "react";
import { useCloudStore } from "@/store";

import "taro-ui/dist/style/index.scss";
import "./app.less";

const App = (props: PropsWithChildren) => {
  const { initialized, initializeCloud } = useCloudStore();

  useEffect(() => {
    if (!initialized) {
      initializeCloud();
    }
  }, [initialized]);

  useDidShow(() => {
    // 初始化逻辑
  });

  useDidHide(() => {
    // 清理逻辑
  });

  return props.children;
};

export default App;
