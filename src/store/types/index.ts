// 用户信息接口
export interface UserInfo {
  // 基础信息
  _id?: string; // 用户ID（云开发自动生成）
  _openid?: string; // 微信用户唯一标识（云开发自动生成）
  phone: string; // 手机号（登录账号）
  password?: string; // 加密后的密码
  nickname?: string; // 用户昵称
  avatarUrl?: string; // 头像URL
  bio?: string; // 个人简介
  gender?: number; // 性别（0：未知，1：男，2：女）

  // 地理位置信息
  country?: string; // 国家
  province?: string; // 省份
  city?: string; // 城市
  district?: string; // 区/县
  ip?: string; // IP地址

  // 统计数据
  followingCount?: number; // 关注数
  followersCount?: number; // 粉丝数
  notesCount?: number; // 发布的笔记数
  likesCount?: number; // 获得的点赞数
  collectionsCount?: number; // 获得的收藏数

  // 用户内容
  notes?: string[]; // 发布的笔记ID列表
  likedNotes?: string[]; // 点赞的笔记ID列表
  collectedNotes?: string[]; // 收藏的笔记ID列表
  following?: string[]; // 关注的用户ID列表
  followers?: string[]; // 粉丝的用户ID列表

  // 账号状态
  status?: "active" | "banned" | "deleted"; // 账号状态
  isVerified?: boolean; // 是否认证
  role?: "user" | "admin"; // 用户角色

  // 时间信息
  createTime?: Date; // 创建时间
  updateTime?: Date; // 更新时间
  lastLoginTime?: Date; // 最后登录时间

  // 其他设置
  settings?: {
    notificationEnabled?: boolean; // 是否开启通知
    privacyLevel?: "public" | "friends" | "private"; // 隐私设置
    theme?: "light" | "dark"; // 主题设置
    language?: "zh" | "en"; // 语言设置
  };
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
  checkLoginStatus: () => Promise<boolean>;
  login: (params: LoginParams) => Promise<boolean>;
  logout: () => void;
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

export interface Comment {
  _id: string;
  noteId: string;
  content: string;
  images?: string[];
  author: {
    _id: string;
    nickname: string;
    avatarUrl: string;
  };
  replyTo?: {
    commentId: string;
    userId: string;
    nickname: string;
  };
  parentId?: string;
  likes: number;
  replies: number;
  showReplies?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Note {
  _id: string;
  title: string;
  content: string;
  images: string[];
  author: {
    _id: string;
    nickname: string;
    phone: string;
    avatarUrl: string;
  };
  location?: {
    address: string;
    name: string;
    province: string;
    city: string;
    district: string;
    latitude: number;
    longitude: number;
  };
  likes: number;
  collections: number;
  comments: number;
  createTime: Date;
  updateTime: Date;
  isLiked?: boolean;
  isCollected?: boolean;
}

export interface NoteState {
  notes: Note[];
  currentNote: Note | null;
  loading: boolean;
  hasMore: boolean;
  currentPage: number;
  pageSize: number;

  // 获取笔记列表
  fetchNotes: (refresh?: boolean) => Promise<void>;
  // 获取笔记详情
  fetchNoteDetail: (noteId: string) => Promise<void>;
  // 点赞笔记
  likeNote: (noteId: string) => Promise<void>;
  // 收藏笔记
  collectNote: (noteId: string) => Promise<void>;
  // 重置当前笔记
  resetCurrentNote: () => void;
}

// 分类接口
export interface Category {
  _id: string;
  name: string;
}

// 分类状态接口
export interface CategoryState {
  categories: Category[];
  loading: boolean;
  error: string | null;

  // 获取所有分类
  fetchCategories: () => Promise<void>;
}
