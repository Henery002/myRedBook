import { View } from "@tarojs/components";
import styles from "./index.less";

interface SkeletonProps {
  loading?: boolean;
  row?: number;
}

export default function Skeleton({ loading = true, row = 1 }: SkeletonProps) {
  if (!loading) return null;

  return (
    <View className={styles.skeleton}>
      {Array(row)
        .fill(null)
        .map((_, index) => (
          <View key={index} className={styles.skeletonItem}>
            <View className={styles.image} />
            <View className={styles.content}>
              <View className={styles.title} />
              <View className={styles.desc} />
            </View>
          </View>
        ))}
    </View>
  );
}
