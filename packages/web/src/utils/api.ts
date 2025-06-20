import axios, { AxiosResponse } from 'axios';
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  Memo,
  CreateMemoRequest,
  UpdateMemoRequest,
  MemosQueryParams,
  Tag,
  Comment,
  CreateCommentRequest,
  User,
  UserStats,
  Settings,
  DailyMemoStats,
  ApiToken,
  CreateApiTokenRequest
} from '@/types';

// API基础配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理统一错误
api.interceptors.response.use(
  (response: AxiosResponse<any>) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token过期，清除本地存储并跳转到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 工具函数：处理API响应 - 兼容新旧两种格式
const handleApiResponse = <T>(response: AxiosResponse<any>): T => {
  // 检查是否是旧的包装格式 {success: true, data: {...}}
  if (response.data && typeof response.data === 'object' && 'success' in response.data) {
    if (response.data.success) {
      return response.data.data as T;
    } else {
      throw new Error(response.data.error || 'API request failed');
    }
  }
  
  // 新的直接格式：直接返回响应数据
  return response.data as T;
};

// 认证相关API
export const authApi = {
  // 登录
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<any>('/api/v1/auth/login', credentials);
    return handleApiResponse(response);
  },

  // 注册
  register: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<any>('/api/v1/auth/register', credentials);
    return handleApiResponse(response);
  },

  // 获取当前用户信息
  me: async (): Promise<User> => {
    const response = await api.get<any>('/api/v1/auth/me');
    return handleApiResponse(response);
  },

  // 刷新token
  refresh: async (): Promise<{ token: string }> => {
    const response = await api.post<ApiResponse<{ token: string }>>('/api/v1/auth/refresh');
    return handleApiResponse(response);
  },

  // 创建API令牌
  createToken: async (data: CreateApiTokenRequest): Promise<ApiToken> => {
    const response = await api.post<ApiResponse<ApiToken>>('/api/v1/auth/tokens', data);
    return handleApiResponse(response);
  },

  // 获取API令牌列表
  getTokens: async (): Promise<ApiToken[]> => {
    const response = await api.get<ApiResponse<ApiToken[]>>('/api/v1/auth/tokens');
    return handleApiResponse(response);
  },

  // 删除API令牌
  deleteToken: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<void>>(`/api/v1/auth/tokens/${id}`);
    return handleApiResponse(response);
  },
};

// Memo相关API
export const memoApi = {
  // 获取memo列表
  getMemos: async (params?: MemosQueryParams): Promise<Memo[]> => {
    const response = await api.get<any>('/api/v1/memos', { params });
    return handleApiResponse(response);
  },

  // 获取单个memo
  getMemo: async (id: number): Promise<Memo> => {
    const response = await api.get<any>(`/api/v1/memos/${id}`);
    return handleApiResponse(response);
  },

  // 创建memo
  createMemo: async (memo: CreateMemoRequest): Promise<Memo> => {
    const response = await api.post<any>('/api/v1/memos', memo);
    return handleApiResponse(response);
  },

  // 更新memo
  updateMemo: async (id: number, memo: UpdateMemoRequest): Promise<Memo> => {
    const response = await api.put<any>(`/api/v1/memos/${id}`, memo);
    return handleApiResponse(response);
  },

  // 删除memo
  deleteMemo: async (id: number): Promise<void> => {
    const response = await api.delete<any>(`/api/v1/memos/${id}`);
    handleApiResponse(response);
  },

  // 获取memo统计
  getMemoStats: async (creatorId: number): Promise<DailyMemoStats> => {
    const response = await api.get<ApiResponse<DailyMemoStats>>('/api/v1/memos/stats', {
      params: { creatorId }
    });
    return handleApiResponse(response);
  },
};

// 标签相关API
export const tagApi = {
  // 获取所有标签
  getTags: async (): Promise<Tag[]> => {
    const response = await api.get<ApiResponse<Tag[]>>('/api/v1/tags');
    return handleApiResponse(response);
  },
};

// 评论相关API
export const commentApi = {
  // 获取memo的评论
  getComments: async (memoId: number): Promise<Comment[]> => {
    const response = await api.get<ApiResponse<Comment[]>>(`/api/v1/comments/memo/${memoId}`);
    return handleApiResponse(response);
  },

  // 创建评论
  createComment: async (memoId: number, comment: CreateCommentRequest): Promise<Comment> => {
    const response = await api.post<ApiResponse<Comment>>(`/api/v1/comments/memo/${memoId}`, comment);
    return handleApiResponse(response);
  },
};

// 用户相关API
export const userApi = {
  // 获取用户统计
  getUserStats: async (userId: number): Promise<UserStats> => {
    const response = await api.get<ApiResponse<UserStats>>(`/api/v1/users/${userId}/stats`);
    return handleApiResponse(response);
  },

  // 获取所有用户（管理员）
  getUsers: async (): Promise<User[]> => {
    const response = await api.get<ApiResponse<User[]>>('/api/v1/users');
    return handleApiResponse(response);
  },

  // 修改密码
  changePassword: async (userId: number, data: { currentPassword: string; newPassword: string }): Promise<void> => {
    const response = await api.put<ApiResponse<void>>(`/api/v1/users/${userId}/password`, data);
    handleApiResponse(response);
  },

  // 创建用户（管理员）
  createUser: async (data: { username: string; password: string; role: 'USER' | 'ADMIN' }): Promise<User> => {
    const response = await api.post<ApiResponse<User>>('/api/v1/users', data);
    return handleApiResponse(response);
  },

  // 更新用户（管理员）
  updateUser: async (userId: number, data: { username?: string; password?: string; role?: 'USER' | 'ADMIN' }): Promise<User> => {
    const response = await api.put<ApiResponse<User>>(`/api/v1/users/${userId}`, data);
    return handleApiResponse(response);
  },

  // 删除用户（管理员）
  deleteUser: async (userId: number): Promise<void> => {
    const response = await api.delete<ApiResponse<void>>(`/api/v1/users/${userId}`);
    handleApiResponse(response);
  },
};

// 设置相关API
export const settingsApi = {
  // 获取公开设置
  getPublicSettings: async (): Promise<Settings> => {
    const response = await api.get<ApiResponse<Settings>>('/api/v1/settings/public');
    return handleApiResponse(response);
  },

  // 获取所有设置（管理员）
  getSettings: async (): Promise<Settings> => {
    const response = await api.get<ApiResponse<Settings>>('/api/v1/settings');
    return handleApiResponse(response);
  },

  // 更新设置（管理员）
  updateSettings: async (settings: Partial<Settings>): Promise<void> => {
    const response = await api.put<ApiResponse<null>>('/api/v1/settings', settings);
    handleApiResponse(response);
  },
};

// 导出axios实例，供特殊需求使用
export { api };

// 工具函数：格式化错误信息
export const getErrorMessage = (error: any): string => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return '未知错误';
}; 