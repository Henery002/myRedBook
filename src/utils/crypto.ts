/*
import Taro from "@tarojs/taro";

export const encryptPassword = (password: string): string => {
  return (
    Taro.getStorageSync("password_md5") ||
    Taro.md5(password + "myRedBook_salt").toString()
  );
};
*/

import { SHA256 } from "crypto-js";

// 密码加密函数
export const encryptPassword = (password: string): string => {
  return SHA256(password + "myRedBook_salt").toString();
};

/*
import { createHash } from "crypto";

// 密码加密函数
export const encryptPassword = (password: string): string => {
  const hash = createHash("sha256");
  hash.update(password + "myRedBook_salt"); // 加盐
  return hash.digest("hex");
};
*/
