import { ApiResponse, Env, JWTPayload, User } from './types';

// 声明外部依赖类型
declare const bcrypt: {
  hash(data: string, saltOrRounds: number): Promise<string>;
  compare(data: string, encrypted: string): Promise<boolean>;
};

declare const jwt: {
  sign(payload: any, secretOrPrivateKey: string): string;
  verify(token: string, secretOrPublicKey: string): any;
};

// API响应工具函数
export function success<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message };
}

export function error(message: string, statusCode = 400): any {
  return new (globalThis as any).Response(
    JSON.stringify({ success: false, error: message }),
    {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// 密码加密
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

// 密码验证
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// JWT令牌生成
export function generateToken(user: User, secret: string): string {
  const payload: JWTPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7天过期
  };
  
  return jwt.sign(payload, secret);
}

// JWT令牌验证
export function verifyToken(token: string, secret: string): JWTPayload | null {
  try {
    return jwt.verify(token, secret) as JWTPayload;
  } catch {
    return null;
  }
}

// 从请求头获取Bearer token
export function getTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

// 获取当前时间戳
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

// 解析分页参数
export function parsePagination(url: any) {
  const page = Math.max(1, parseInt(url.searchParams?.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams?.get('limit') || '20')));
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
}

// 构建CORS响应头
export function getCorsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
}

// 处理CORS预检请求
export function handleOptions(env: Env): any {
  return new (globalThis as any).Response(null, {
    status: 204,
    headers: getCorsHeaders(env.CORS_ORIGIN)
  });
}

// 验证邮箱格式（如果需要）
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 清理Markdown内容（基础清理）
export function sanitizeMarkdown(content: string): string {
  // 移除潜在的恶意脚本标签
  return content
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}

// 从Markdown提取标签
export function extractTagsFromContent(content: string): string[] {
  const tagRegex = /#([a-zA-Z0-9\u4e00-\u9fa5_-]+)/g;
  const tags: string[] = [];
  let match;
  
  while ((match = tagRegex.exec(content)) !== null) {
    const tag = match[1];
    if (tag && !tags.includes(tag)) {
      tags.push(tag);
    }
  }
  
  return tags;
} 