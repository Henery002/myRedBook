import { View, Text, Image, ScrollView } from "@tarojs/components";
import { useEffect, useState, useCallback, useMemo } from "react";
import Skeleton from "@/components/Skeleton";
import {
  AtSearchBar,
  AtTabs,
  AtTabsPane,
  AtActivityIndicator,
  AtIcon,
} from "taro-ui";
import { formatLikes } from "@/utils/format";
import Taro from "@tarojs/taro";
import { useNoteStore, useCategoryStore } from "@/store";
import styles from "./index.less";

const PAGE_SIZE = 10;
// 主页内容组件
const HomeContent: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const { notes, loading, hasMore, fetchNotes } = useNoteStore();
  const {
    categories,
    loading: categoriesLoading,
    fetchCategories,
  } = useCategoryStore();
  const [tabList, setTabList] = useState([{ title: "推荐" }]);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // 初始化加载 - 只在组件首次挂载时执行一次
  useEffect(() => {
    const loadInitialData = async () => {
      // 尝试从缓存加载数据，如果没有缓存则从服务器加载
      await fetchNotes(false, false);
      setInitialLoadDone(true);
    };

    loadInitialData();
  }, [fetchNotes]);

  // 加载分类数据
  useEffect(() => {
    const loadCategories = async () => {
      await fetchCategories();
    };

    loadCategories();
  }, [fetchCategories]);

  // 当分类数据加载完成后，更新 tabList
  useEffect(() => {
    if (categories.length > 0) {
      // 保留推荐分类，添加数据库中的分类
      const newTabList = [
        { title: "推荐" },
        ...categories.map((category) => ({ title: category.name })),
      ];
      setTabList(newTabList);
    }
  }, [categories]);

  // 处理下拉刷新 - 强制从服务器刷新数据
  const handlePullRefresh = useCallback(() => {
    fetchNotes(true, true); // 强制刷新
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
  const handleTabClick = useCallback(
    (value: number) => {
      setCurrent(value);
      // TODO: 根据标签筛选内容
      fetchNotes(true, false); // 非强制刷新，优先使用缓存
    },
    [fetchNotes],
  );

  // 处理加载更多
  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchNotes(false, false); // 非强制刷新，优先使用缓存
    }
  }, [loading, hasMore, fetchNotes]);

  // 处理点击笔记
  const handleNoteClick = useCallback((noteId: string) => {
    Taro.navigateTo({
      url: `/packageA/pages/detailsPage/index?id=${noteId}`,
    });
  }, []);

  // 使用useMemo优化瀑布流渲染
  const leftColumnNotes = useMemo(
    () => notes.filter((_, i) => i % 2 === 0),
    [notes],
  );

  const rightColumnNotes = useMemo(
    () => notes.filter((_, i) => i % 2 === 1),
    [notes],
  );

  const renderWaterfall = () => {
    // 显示骨架屏
    if (loading && !notes.length) {
      return (
        <View className={styles.waterfallWrapper}>
          <View className={styles.column}>
            <Skeleton loading={true} row={3} />
          </View>
          <View className={styles.column}>
            <Skeleton loading={true} row={3} />
          </View>
        </View>
      );
    }

    return (
      <View className={styles.waterfallWrapper}>
        <View className={styles.column}>
          {leftColumnNotes.map((item) => (
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
                <View className={styles.userInfo}>
                  <View className={styles.userInfoItem}>
                    <Image src={item.author.avatarUrl} mode="aspectFill" />
                    <View className={styles.userName}>
                      {item.author?.nickname || item.author?.phone}
                    </View>
                  </View>
                  <View className={styles.actionItem}>
                    <AtIcon
                      color={item.isLiked ? "#ff2442" : "#999"}
                      value={item.isLiked ? "heart-2" : "heart"}
                      size="16"
                    />
                    <View className={styles.likes}>
                      {formatLikes(item.likes)}
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
        <View className={styles.column}>
          {rightColumnNotes.map((item) => (
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
                <View className={styles.userInfo}>
                  <View className={styles.userInfoItem}>
                    <Image src={item.author.avatarUrl} mode="aspectFill" />
                    <View className={styles.userName}>
                      {item.author?.nickname || item.author?.phone}
                    </View>
                  </View>
                  <View className={styles.actionItem}>
                    <AtIcon
                      color={item.isLiked ? "#ff2442" : "#999"}
                      value={item.isLiked ? "heart-2" : "heart"}
                      size="16"
                    />
                    <View className={styles.likes}>
                      {formatLikes(item.likes)}
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View className={styles.homeContent}>
      <View className={styles.listPageWrapper}>
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
            scroll
            swipeable
            animated
          >
            {tabList.map((_, index) => (
              <AtTabsPane current={current} index={index} key={index}>
                <ScrollView
                  className={styles.scrollView}
                  scrollY
                  scrollWithAnimation
                  enableBackToTop
                  refresherEnabled
                  refresherTriggered={loading}
                  onRefresherRefresh={handlePullRefresh}
                  onScrollToLower={handleLoadMore}
                  lowerThreshold={100}
                >
                  {renderWaterfall()}
                  {loading && notes.length > 0 && (
                    <View className={styles.loading}>
                      <AtActivityIndicator
                        content="加载更多..."
                        color="#f09c20"
                      />
                    </View>
                  )}
                  {!loading && !hasMore && notes.length > 0 && (
                    <View className={styles.noMore}>
                      <Text>- 没有更多内容了 -</Text>
                    </View>
                  )}
                  {!loading && notes.length === 0 && initialLoadDone && (
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
    </View>
  );
};

export default HomeContent;
