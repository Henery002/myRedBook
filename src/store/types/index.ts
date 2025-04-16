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
    avatarUrl: string;
  };
  location?: string;
  likes: number;
  collections: number;
  comments: number;
  createdAt: Date;
  updatedAt: Date;
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
