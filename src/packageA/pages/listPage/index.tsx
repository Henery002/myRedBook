import { View, Text, Image, ScrollView } from "@tarojs/components";
import { useEffect, useState, useCallback } from "react";
import Skeleton from "@/components/Skeleton";
import { AtSearchBar, AtTabs, AtTabsPane, AtActivityIndicator } from "taro-ui";
import Taro from "@tarojs/taro";
import { useNoteStore } from "@/store";
import styles from "./index.less";

const ListPage = () => {
  const [current, setCurrent] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const { notes, loading, hasMore, fetchNotes } = useNoteStore();

  // 初始加载和下拉刷新
  useEffect(() => {
    fetchNotes(true);
  }, [fetchNotes]);

  // 处理搜索
  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  // 处理搜索确认
  const handleSearchConfirm = useCallback(() => {
    // TODO: 实现搜索功能
    console.log("搜索:", searchValue);
  }, [searchValue]);

  // 处理标签切换
  const handleTabClick = useCallback((value: number) => {
    setCurrent(value);
    // TODO: 根据标签筛选内容
  }, []);

  // 处理加载更多
  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchNotes();
    }
  }, [loading, hasMore, fetchNotes]);

  // 处理点击笔记
  const handleNoteClick = useCallback((noteId: string) => {
    Taro.navigateTo({
      url: `/packageA/pages/detailsPage/index?id=${noteId}`,
    });
  }, []);

  const tabList = [
    { title: "推荐" },
    { title: "视频" },
    { title: "直播" },
    { title: "美食" },
  ];

  console.log(notes, "notes");

  const renderWaterfall = () => {
    if (loading) {
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
        <View className={styles.column}>
          {notes
            .filter((_, i) => i % 2 === 0)
            .map((item) => (
              <View
                className={styles.card}
                key={item._id}
                onClick={() => handleNoteClick(item._id)}
              >
                <View className={styles.cover}>
                  <Image src={item.images?.[0]} mode="widthFix" lazyLoad />
                </View>
                <View className={styles.content}>
                  <View className={styles.title}>{item.title}</View>
                  <View className={styles.desc}>{item.content}</View>
                </View>
              </View>
            ))}
        </View>
        <View className={styles.column} style={{ position: "absolute" }}>
          {notes
            .filter((_, i) => i % 2 === 1)
            .map((item) => (
              <View
                className={styles.card}
                key={item._id}
                onClick={() => handleNoteClick(item._id)}
              >
                <View className={styles.cover}>
                  <Image src={item.images?.[0]} mode="widthFix" lazyLoad />
                </View>
                <View className={styles.content}>
                  <View className={styles.title}>{item.title}</View>
                  <View className={styles.desc}>{item.content}</View>
                </View>
              </View>
            ))}
        </View>
      </>
    );
  };

  return (
    <View className={styles.listPageWrapper}>
      {/* 搜索栏 */}
      <AtSearchBar
        value={searchValue}
        onChange={handleSearch}
        onConfirm={handleSearchConfirm}
        onActionClick={handleSearchConfirm}
      />

      <View className={styles.tabs}>
        <AtTabs
          current={current}
          tabList={tabList}
          onClick={handleTabClick}
          swipeable={false}
        >
          {tabList.map((v) => (
            <AtTabsPane current={current} index={0}>
              <ScrollView
                // className={styles.contentWrapper}
                className={styles.waterfall}
                scrollY
                scrollWithAnimation
                enableBackToTop
                // refresherEnabled
                // refresherTriggered={loading}
                onRefresherRefresh={() => {
                  // fetchNotes(true);
                }}
                // onScrollToLower={handleLoadMore}
                // lowerThreshold={100}
              >
                {renderWaterfall()}
                {loading && !notes.length && (
                  <View className={styles.loading}>
                    <AtActivityIndicator content="加载中..." />
                  </View>
                )}
                {loading && notes.length > 0 && (
                  <View className={styles.loading}>
                    <AtActivityIndicator content="加载更多..." />
                  </View>
                )}
                {!loading && !hasMore && notes.length > 0 && (
                  <View className={styles.noMore}>
                    <Text>- 没有更多内容了 -</Text>
                  </View>
                )}
                {!loading && notes.length === 0 && (
                  <View className={styles.empty}>
                    <Text>暂无内容</Text>
                  </View>
                )}
              </ScrollView>
            </AtTabsPane>
          ))}
        </AtTabs>
      </View>
    </View>
  );
};

export default ListPage;
