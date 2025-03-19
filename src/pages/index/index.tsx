import { View } from "@tarojs/components";

import ListPage from "../details/list";
import UserPage from "../details/user";
import TabBar from "../details/tabBar";

import styles from './index.less';

export default function IndexPage() {
  return (
    <View className={styles.BasicLayoutWrapper}>
      <ListPage />
      {/* <UserPage /> */}
      <TabBar />
    </View>
  )
}