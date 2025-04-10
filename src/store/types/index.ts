// 用户信息接口
export interface UserInfo {
  _id?: string;
  phone: string;
  password?: string;
  avatarUrl?: string;
  nickName?: string;
  gender?: number;
  country?: string;
  province?: string;
  city?: string;
  _openid?: string;
  createTime?: Date;
}

// 登录参数接口
export interface LoginParams {
  phone: string;
  password: string;
}

// 用户状态接口
export interface UserState {
  userInfo: UserInfo | null;
  isLogin: boolean;
  loading: boolean;
  setUserInfo: (userInfo: UserInfo) => void;
  login: (params: LoginParams) => Promise<void>;
  logout: () => void;
  checkLoginStatus: () => Promise<boolean>;
}

// 应用全局状态接口
export interface AppState {
  theme: "light" | "dark";
  language: "zh" | "en";
  setTheme: (theme: "light" | "dark") => void;
  setLanguage: (lang: "zh" | "en") => void;
}

// 云开发状态接口
export interface CloudState {
  initialized: boolean;
  error: string | null;
  initializeCloud: () => Promise<void>;
  resetError: () => void;
}
