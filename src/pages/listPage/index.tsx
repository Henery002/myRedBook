import { useState } from "react";
import { View } from "@tarojs/components";
import { AtSearchBar, AtTabs, AtTabsPane, AtCard } from "taro-ui";

import { TAB_LIST, data } from "@/pages/mockdata.js";

import styles from "@/pages/index/index.less";

export default function ListPage() {
  const [current, setCurrent] = useState<number>(0);

  /**
   * 处理标签页切换事件的回调函数
   * @param v - 当前选中的标签页值
   */
  const handleTabChange = (v) => {
    setCurrent(v);
  };

  return (
    <View className={styles.listPageWrapper}>
      <AtSearchBar
        value=""
        placeholder="搜索你感兴趣的内容"
        onChange={() => null}
      />

      <AtTabs
        scroll
        animated
        swipeable
        current={current}
        tabList={TAB_LIST}
        onClick={handleTabChange}
      >
        {TAB_LIST.slice(0, 1).map((v, i) => {
          return (
            <AtTabsPane current={current} index={i}>
              <View className={styles.tabPaneView}>
                {/* 左列 */}
                <View
                  style={{
                    width: "calc(50% - 18px)",
                    margin: "6px",
                    display: "inline-block",
                  }}
                >
                  {data.slice(0, Math.ceil(data.length / 2)).map((item) => (
                    <AtCard
                      key={item.id}
                      // style={{ marginBottom: '16rpx' }}
                      title={item.title}
                      thumb={item?.cover}
                    >
                      <View className="content">{item.desc}</View>
                    </AtCard>
                  ))}
                </View>

                {/* 右列 */}
                <View
                  style={{
                    width: "calc(50% - 18px)",
                    margin: "6px",
                    display: "inline-block",
                  }}
                >
                  {data.slice(Math.ceil(data.length / 2)).map((item) => (
                    <AtCard
                      key={item.id}
                      // style={{ marginBottom: '16rpx' }}
                      title={item.title}
                      thumb={item?.cover}
                    >
                      <View className="content">{item.desc}</View>
                    </AtCard>
                  ))}
                </View>
              </View>
            </AtTabsPane>
          );
        })}
      </AtTabs>
    </View>
  );
}
