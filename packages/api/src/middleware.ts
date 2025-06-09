import { Context, Next } from 'hono';
import { Env, User, RequestContext } from './types';
import { getTokenFromHeader, verifyToken, error } from './utils';

// 声明Context类型扩展
declare module 'hono' {
  interface ContextVariableMap {
    user: User;
    userId: number;
  }
}

// 认证中间件 - 验证JWT token
export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  const token = getTokenFromHeader(authHeader);
  
  if (!token) {
    return error('Authentication required', 401);
  }
  
  const payload = verifyToken(token, c.env.JWT_SECRET);
  if (!payload) {
    return error('Invalid or expired token', 401);
  }
  
  // 从数据库获取用户信息
  try {
    const stmt = c.env.DB.prepare('SELECT id, username, role, created_at, updated_at FROM users WHERE id = ?');
    const user = await stmt.bind(payload.userId).first<User>();
    
    if (!user) {
      return error('User not found', 401);
    }
    
    // 将用户信息存储在上下文中
    c.set('user', user);
    c.set('userId', user.id);
    
    await next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return error('Authentication failed', 401);
  }
}

// 可选认证中间件 - 如果有token则验证，没有则继续
export async function optionalAuthMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  const token = getTokenFromHeader(authHeader);
  
  if (token) {
    const payload = verifyToken(token, c.env.JWT_SECRET);
    if (payload) {
      try {
        const stmt = c.env.DB.prepare('SELECT id, username, role, created_at, updated_at FROM users WHERE id = ?');
        const user = await stmt.bind(payload.userId).first<User>();
        
        if (user) {
          c.set('user', user);
          c.set('userId', user.id);
        }
      } catch (err) {
        console.error('Optional auth middleware error:', err);
      }
    }
  }
  
  await next();
}

// 管理员权限中间件
export async function adminMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const user = c.get('user');
  
  if (!user || user.role !== 'ADMIN') {
    return error('Admin access required', 403);
  }
  
  await next();
}

// CORS中间件
export function corsMiddleware(origin: string) {
  return async (c: Context, next: Next) => {
    // 处理预检请求
    if (c.req.method === 'OPTIONS') {
      return new (globalThis as any).Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400'
        }
      });
    }
    
    await next();
    
    // 为所有响应添加CORS头
    c.res.headers.set('Access-Control-Allow-Origin', origin);
    c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  };
}

// 错误处理中间件
export async function errorMiddleware(c: Context, next: Next) {
  try {
    await next();
  } catch (err) {
    console.error('API Error:', err);
    
    // 如果是已知的API错误，返回对应状态码
    if (err instanceof Error && err.message.includes('UNIQUE constraint failed')) {
      return error('Resource already exists', 409);
    }
    
    return error('Internal server error', 500);
  }
}

// 日志中间件
export async function loggerMiddleware(c: Context, next: Next) {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;
  
  await next();
  
  const duration = Date.now() - start;
  const status = c.res.status;
  
  console.log(`${method} ${path} ${status} - ${duration}ms`);
} 