// 与后端API保持一致的类型定义

// 用户相关类型
export interface User {
  id: number;
  username: string;
  role: 'USER' | 'ADMIN';
  created_at: number;
  updated_at: number;
}

export interface UserSettings {
  user_id: number;
  theme: string;
  language: string;
  markdown_plugins: string;
}

// Memo相关类型
export interface Memo {
  id: number;
  user_id: number;
  content: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  pinned: number;
  state?: 'NORMAL' | 'ARCHIVED';
  created_at: number;
  updated_at: number;
  tags?: Tag[];
  comments_count?: number;
  username?: string; // 从API联表查询返回
}

export interface CreateMemoRequest {
  content: string;
  visibility?: 'PUBLIC' | 'PRIVATE';
  pinned?: boolean;
  state?: 'NORMAL' | 'ARCHIVED';
  tags?: string[];
}

export interface UpdateMemoRequest extends Partial<CreateMemoRequest> {}

// 标签类型
export interface Tag {
  id: number;
  name: string;
  created_at: number;
  memo_count?: number; // 从API统计返回
}

// 评论类型
export interface Comment {
  id: number;
  memo_id: number;
  user_id: number;
  parent_id?: number;
  content: string;
  created_at: number;
  username?: string;
  replies?: Comment[];
}

export interface CreateCommentRequest {
  content: string;
  parent_id?: number;
}

// 认证相关类型
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  role: 'USER' | 'ADMIN';
}

export interface UpdateUserRequest {
  username?: string;
  password?: string;
  role?: 'USER' | 'ADMIN';
}

export interface ApiToken {
  id: number;
  name: string;
  token?: string; // only returned when creating
  token_id: string;
  created_at: number;
  expires_at?: number;
  last_used_at?: number;
}

export interface CreateApiTokenRequest {
  name: string;
  expires_at?: number; // timestamp, undefined means never expire
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分页类型
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 查询参数类型
export interface MemosQueryParams extends PaginationParams {
  visibility?: 'PUBLIC' | 'PRIVATE' | 'ALL';
  state?: 'NORMAL' | 'ARCHIVED' | 'ALL';
  tag?: string;
  search?: string;
  pinned?: boolean;
  creatorId?: number;
}

// 统计类型
export interface UserStats {
  totalMemos: number;
  totalTags: number;
  totalComments: number;
  firstMemoAt?: number;
  lastMemoAt?: number;
}

export interface DailyMemoStats {
  [date: string]: number; // YYYY-MM-DD -> count
}

// 设置类型
export interface Settings {
  site_title: string;
  site_description: string;
  allow_registration: string;
  default_visibility: string;
  disable_password_login?: string;
  disable_username_mod?: string;
  disable_nickname_mod?: string;
  week_start_day?: string;
  custom_css?: string;
  custom_js?: string;
}

// 前端特有类型
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export interface AppState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  loading: boolean;
  settings: Settings | null;
}

export interface MemoFormData {
  content: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  pinned: boolean;
  state?: 'NORMAL' | 'ARCHIVED';
  tags: string[];
}

// 路由类型
export interface RouteConfig {
  path: string;
  element: any; // React组件类型
  protected?: boolean;
  adminOnly?: boolean;
} 