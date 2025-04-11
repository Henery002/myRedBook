import { useState, useCallback, useEffect } from "react";
import { View, Image, ScrollView, Text } from "@tarojs/components";
import { AtSearchBar, AtTabs, AtTabsPane, AtActivityIndicator } from "taro-ui";
import Taro from "@tarojs/taro";
import Skeleton from "@/components/Skeleton";

import { TAB_LIST, data } from "@/pages/mockdata.js";

import styles from "./index.less";

const PAGE_SIZE = 6;

export default function ListPage() {
  const [current, setCurrent] = useState<number>(0);
  const [searchValue, setSearchValue] = useState<string>("");
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [list, setList] = useState<typeof data>([]);
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    loadInitialData();
  }, [current]); // tab切换时重新加载

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // 后续接口请求写在这里
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const newList = data.slice(0, PAGE_SIZE);
      setList(newList);
      setHasMore(newList.length === PAGE_SIZE);
      setPage(1);
    } catch (error) {
      console.error("加载数据失败", error);
      Taro.showToast({
        title: "加载数据失败",
        icon: "none",
        duration: 1200,
      });
    } finally {
      setLoading(false);
      console.log("加载数据完成...");
    }
  };

  const loadMore = async () => {
    if (!hasMore || loading) return;

    setLoading(true);
    try {
      // 后续接口请求写在这里
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const start = page * PAGE_SIZE;
      const newList = data.slice(start, start + PAGE_SIZE);

      if (newList.length > 0) {
        setList((prev) => [...prev, ...newList]);
        setPage((prev) => prev + 1);
        setHasMore(newList.length === PAGE_SIZE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("加载更多数据失败", error);
      Taro.showToast({
        title: "加载更多数据失败",
        icon: "none",
        duration: 1200,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScrollToLower = useCallback(() => {
    loadMore();
  }, [loadMore]);

  /**
   * 处理标签页切换事件的回调函数
   * @param v - 当前选中的标签页值
   */
  const handleTabChange = (v: number) => {
    setCurrent(v);
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  // 处理搜索确认的回调函数
  const handleSearchConfirm = () => {
    if (!searchValue.trim()) {
      return;
    }
    console.log("searchValue", searchValue);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadInitialData();

      Taro.showToast({
        title: "刷新成功",
        icon: "success",
        duration: 1200,
      });
    } catch (error) {
      console.error("刷新失败：", error);
      Taro.showToast({
        title: "刷新失败",
        icon: "error",
        duration: 1200,
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleCardClick = (id: string) => {
    Taro.navigateTo({
      url: `/pages/detail/index?id=${id}`,
    });
    console.log("跳转到详情页：", id);
  };

  const renderWaterfall = () => {
    if (loading && page === 1) {
      return (
        <>
          <View className={styles.column}>
            <Skeleton loading={true} row={3} />
          </View>
          <View className={styles.column}>
            <Skeleton loading={true} row={3} />
          </View>
        </>
      );
    }

    return (
      <>
        {/* 左列 */}
        <View className={styles.column}>
          {list
            .filter((_, i) => i % 2 === 0)
            .map((item) => (
              <View
                className={styles.card}
                key={item.id}
                onClick={() => handleCardClick(item.id)}
              >
                <View className={styles.cover}>
                  <Image src={item.cover} mode="aspectFill" lazyLoad />
                </View>
                <View className={styles.content}>
                  <View className={styles.title}>{item.title}</View>
                  <View className={styles.desc}>{item.desc}</View>
                </View>
              </View>
            ))}
        </View>

        {/* 右列 */}
        <View className={styles.column}>
          {list
            .filter((_, i) => i % 2 === 1)
            .map((item) => (
              <View
                key={item.id}
                className={styles.card}
                onClick={() => handleCardClick(item.id)}
              >
                <View className={styles.cover}>
                  <Image src={item.cover} mode="aspectFill" lazyLoad />
                </View>
                <View className={styles.content}>
                  <View className={styles.title}>{item.title}</View>
                  <View className={styles.desc}>{item.desc}</View>
                </View>
              </View>
            ))}
        </View>

        {loading && page > 1 && (
          <View className={styles.loading}>
            <AtActivityIndicator /* mode="center" */ content="加载中..." />
          </View>
        )}

        {!hasMore && list.length > 0 && (
          <View className={styles.noMore}>
            <Text>- 没有更多数据了 -</Text>
          </View>
        )}
      </>
    );
  };

  return (
    <View className={styles.listPageWrapper}>
      <View className={styles.searchBar}>
        <AtSearchBar
          value={searchValue}
          placeholder="搜索你感兴趣的内容"
          onChange={handleSearchChange}
          onConfirm={handleSearchConfirm}
          onActionClick={handleSearchConfirm}
        />
      </View>
      <View className={styles.tabs}>
        <AtTabs
          scroll
          animated
          swipeable
          current={current}
          tabList={TAB_LIST}
          onClick={handleTabChange}
        >
          {TAB_LIST.map((tab, index) => {
            return (
              <AtTabsPane current={current} index={index} key={tab.title}>
                <ScrollView
                  scrollY
                  className={styles.waterfall}
                  refresherEnabled
                  refresherTriggered={refreshing}
                  onRefresherRefresh={onRefresh}
                  onScrollToLower={handleScrollToLower}
                >
                  {renderWaterfall()}
                </ScrollView>
              </AtTabsPane>
            );
          })}
        </AtTabs>
      </View>
    </View>
  );
}
