/**
 * 格式化时间
 * @param dateStr Date字符串或时间戳
 * @returns 格式化后的时间字符串
 */
export function formatTime(dateStr: string | number | Date): string {
  let date: Date;

  try {
    // 如果是数字类型（时间戳），直接创建Date对象
    if (typeof dateStr === "number") {
      date = new Date(dateStr);
    } else if (dateStr instanceof Date) {
      date = dateStr;
    } else {
      // 如果是字符串，尝试直接解析
      date = new Date(dateStr);
    }

    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      console.error("Invalid date:", dateStr);
      return "时间未知";
    }
  } catch (error) {
    console.error("Error parsing date:", error);
    return "时间未知";
  }

  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // 小于1分钟
  if (diff < 60 * 1000) {
    return "刚刚";
  }

  // 小于1小时
  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}分钟前`;
  }

  // 小于24小时
  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}小时前`;
  }

  // 小于7天
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`;
  }

  // 显示具体日期
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  // 如果是今年，不显示年份
  if (year === now.getFullYear()) {
    return `${month}月${day}日 ${hours}:${minutes}`;
  }

  return `${year}年${month}月${day}日 ${hours}:${minutes}`;
}

/**
 * 格式化数字（点赞数、评论数等）
 * @param num 要格式化的数字
 * @param options 配置选项
 * @returns 格式化后的字符串
 */
export function formatNumber(
  num: number,
  options: {
    /** 是否显示万位分隔符 */
    useSeparator?: boolean;
    /** 是否使用万作为单位 */
    useWan?: boolean;
    /** 保留小数位数 */
    decimals?: number;
  } = {},
): string {
  const { useSeparator = true, useWan = true, decimals = 1 } = options;

  // 处理无效输入
  if (typeof num !== "number" || isNaN(num)) {
    return "0";
  }

  // 处理负数
  const isNegative = num < 0;
  num = Math.abs(num);

  // 处理万位
  if (useWan && num >= 10000) {
    const wan = 10000;
    const wanNum = num / wan;

    // 如果超过100万，显示为"xx万"
    if (wanNum >= 100) {
      return `${isNegative ? "-" : ""}${wanNum.toFixed(0)}万`;
    }

    // 否则保留一位小数
    return `${isNegative ? "-" : ""}${wanNum.toFixed(decimals)}万`;
  }

  // 处理千位分隔符
  if (useSeparator && num >= 1000) {
    return `${isNegative ? "-" : ""}${num.toLocaleString()}`;
  }

  // 小于1000的数字直接返回
  return `${isNegative ? "-" : ""}${num}`;
}

/**
 * 格式化点赞数（专门用于点赞数显示）
 * @param likes 点赞数
 * @returns 格式化后的点赞数
 */
export function formatLikes(likes: number): string {
  return formatNumber(likes, {
    useSeparator: true,
    useWan: true,
    decimals: 1,
  });
}
