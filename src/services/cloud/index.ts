import Taro from "@tarojs/taro";

// 云开发环境ID
export const cloudEnvId = "cloud1-2gm986mx5cd74abe"; // 替换为你的云开发环境ID

// 初始化云开发
export const initCloud = () => {
  if (!Taro.cloud) {
    console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    return;
  }

  Taro.cloud.init({
    env: cloudEnvId,
    traceUser: true,
  });
};

// 获取云开发数据库实例
export const getDB = () => {
  return Taro.cloud.database();
};

// 获取云开发存储实例
export const getStorage = () => {
  return Taro.cloud.storage();
};
