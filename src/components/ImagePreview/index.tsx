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
  const [scale, setScale] = useState(1);
  const swiperRef = useRef<any>(null);
  const scaleRef = useRef(1);
  const lastDistanceRef = useRef(0);
  const isScalingRef = useRef(false);
  const rafRef = useRef<number>();

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
    }, 300);
  };

  // 处理滑动切换
  const handleChange = (e: any) => {
    setCurrentIndex(e.detail.current);
    resetScale();
  };

  // 处理点击事件
  const handleTap = (e: any) => {
    // 如果点击的是图片本身，不关闭预览
    if (e.target.dataset.type === "image") {
      // return; // 为兼容全屏尺寸的图片预览时没有留白的问题，暂时屏蔽
    }
    handleClose();
  };

  // 重置缩放
  const resetScale = () => {
    scaleRef.current = 1;
    setScale(1);
  };

  // 计算两点之间的距离
  const getDistance = (touch1: any, touch2: any) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 处理双指缩放
  const handleTouchStart = (e: any) => {
    if (e.touches.length === 2) {
      isScalingRef.current = true;
      lastDistanceRef.current = getDistance(e.touches[0], e.touches[1]);
      scaleRef.current = scale;
    }
  };

  const handleTouchMove = (e: any) => {
    if (!isScalingRef.current || e.touches.length !== 2) return;

    // 使用 requestAnimationFrame 优化性能
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scaleFactor = currentDistance / lastDistanceRef.current;
      const newScale = scaleRef.current * scaleFactor;

      // 限制缩放范围并应用平滑过渡
      const limitedScale = Math.min(Math.max(newScale, 0.5), 3);
      setScale(limitedScale);
    });
  };

  const handleTouchEnd = () => {
    isScalingRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    // 如果缩放比例小于1，平滑回到原始大小
    if (scale < 1) {
      setScale(1);
      scaleRef.current = 1;
    }
  };

  // 双击放大/缩小
  const handleDoubleTap = () => {
    const targetScale = scale === 1 ? 2 : 1;
    setScale(targetScale);
    scaleRef.current = targetScale;
  };

  // 清理函数
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

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
          disableTouch={scale !== 1}
        >
          {images.map((image, index) => (
            <SwiperItem key={index} className={styles.previewItem}>
              <View
                className={styles.imageWrapper}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={handleDoubleTap}
              >
                <Image
                  src={image}
                  mode="widthFix"
                  className={styles.previewImage}
                  style={{
                    transform: `scale(${scale})`,
                    transition: isScalingRef.current
                      ? "none"
                      : "transform 0.3s ease-out",
                  }}
                  data-type="image"
                  onClick={(e) => e.stopPropagation()}
                />
              </View>
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
