// 数据库绑定环境变量类型
export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  CORS_ORIGIN?: string;
  R2_BUCKET?: R2Bucket;
  R2_PUBLIC_URL?: string;
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET_NAME?: string;
}

// 声明全局类型以支持Cloudflare Workers D1
declare global {
  interface D1Database {
    prepare(query: string): D1PreparedStatement;
    exec(query: string): Promise<D1ExecResult>;
    batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
  }

  interface D1PreparedStatement {
    bind(...values: any[]): D1PreparedStatement;
    first<T = any>(colName?: string): Promise<T | null>;
    run(): Promise<D1Result>;
    all<T = any>(): Promise<D1Result<T>>;
  }

  interface D1Result<T = any> {
    results?: T[];
    success: boolean;
    error?: string;
    meta: {
      changes: number;
      last_row_id: number;
      duration: number;
    };
  }

  interface D1ExecResult {
    results: D1Result[];
    count: number;
    duration: number;
  }
}

// 用户相关类型
export interface User {
  id: number;
  username: string;
  role: 'USER' | 'ADMIN';
  created_at: number;
  updated_at: number;
}

export interface UserWithPassword extends User {
  password_hash: string;
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

export interface JWTPayload {
  userId: number;
  username: string;
  role: string;
  iat: number;
  exp: number;
  jti?: string; // JWT ID for API tokens
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
  offset?: number;
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
}

// 上下文类型（用于中间件）
export interface RequestContext {
  user?: User;
  userId?: number;
}

export interface ApiToken {
  id: number;
  user_id: number;
  name: string;
  token_id: string;
  created_at: number;
  expires_at?: number;
  last_used_at?: number;
}

export interface CreateApiTokenRequest {
  name: string;
  expires_at?: number; // timestamp, undefined means never expire
}

export interface ApiTokenResponse {
  id: number;
  name: string;
  token: string; // only returned when creating
  token_id: string;
  created_at: number;
  expires_at?: number;
  last_used_at?: number;
}

// 资源类型
export interface Resource {
  id: number;
  filename: string;
  original_name: string;
  content_type: string;
  size: number;
  user_id: number;
  created_at: number;
  url?: string;
} 