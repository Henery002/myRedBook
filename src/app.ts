import { useDidShow, useDidHide } from "@tarojs/taro";
import type { PropsWithChildren } from "react";

import "taro-ui/dist/style/index.scss";
import "./app.less";

const App = (props: PropsWithChildren) => {

  useDidShow(() => {
    // 初始化逻辑
  });

  useDidHide(() => {
    // 清理逻辑
  });

  return props.children;
}

export default App;