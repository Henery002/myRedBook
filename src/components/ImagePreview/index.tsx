import { View, Image, Swiper, SwiperItem } from "@tarojs/components";
import { useState, useEffect, useRef } from "react";
import Taro from "@tarojs/taro";
import styles from "./index.less";

interface ImagePreviewProps {
  images: string[];
  current: number;
  visible: boolean;
  onClose: () => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  images,
  current,
  visible,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(current);
  const [swiperHeight, setSwiperHeight] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const swiperRef = useRef<any>(null);

  // 监听屏幕旋转和尺寸变化
  useEffect(() => {
    if (visible) {
      const updateHeight = () => {
        const systemInfo = Taro.getSystemInfoSync();
        setSwiperHeight(systemInfo.windowHeight);
      };

      updateHeight();
      Taro.onWindowResize(updateHeight);

      return () => {
        Taro.offWindowResize(updateHeight);
      };
    }
  }, [visible]);

  // 处理关闭动画
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300); // 动画持续时间
  };

  // 处理滑动切换
  const handleChange = (e: any) => {
    setCurrentIndex(e.detail.current);
  };

  // 处理点击事件
  const handleTap = (e: any) => {
    // 如果点击的是图片本身，不关闭预览
    if (e.target.dataset.type === "image") {
      return;
    }
    handleClose();
  };

  if (!visible) return null;

  return (
    <View
      className={`${styles.previewContainer} ${isClosing ? styles.closing : ""}`}
      onClick={handleTap}
    >
      <View className={styles.previewContent}>
        <Swiper
          ref={swiperRef}
          className={styles.previewSwiper}
          current={currentIndex}
          onChange={handleChange}
          style={{ height: `${swiperHeight}px` }}
          circular
          duration={300}
          easingFunction="easeInOutCubic"
        >
          {images.map((image, index) => (
            <SwiperItem key={index} className={styles.previewItem}>
              <Image
                src={image}
                mode="widthFix"
                className={styles.previewImage}
                data-type="image"
                onClick={(e) => e.stopPropagation()}
              />
            </SwiperItem>
          ))}
        </Swiper>

        <View className={styles.previewIndicator}>
          {currentIndex + 1} / {images.length}
        </View>
      </View>
    </View>
  );
};

export default ImagePreview;
