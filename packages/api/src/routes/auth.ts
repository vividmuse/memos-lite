import { Hono } from 'hono';
import { Env, LoginRequest, LoginResponse, User, UserWithPassword } from '../types';
import { hashPassword, verifyPassword, generateToken, success, error } from '../utils';
import { authMiddleware } from '../middleware';

const auth = new Hono<{ Bindings: Env }>();

// 用户登录
auth.post('/login', async (c) => {
  try {
    const body = await c.req.json() as LoginRequest;
    const { username, password } = body;

    if (!username || !password) {
      return error('Username and password are required', 400);
    }

    // 查找用户
    const stmt = c.env.DB.prepare('SELECT * FROM users WHERE username = ?');
    const user = await stmt.bind(username).first<UserWithPassword>();

    if (!user) {
      return error('Invalid credentials', 401);
    }

    // 验证密码
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return error('Invalid credentials', 401);
    }

    // 生成Token
    const userInfo: User = {
      id: user.id,
      username: user.username,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    const token = generateToken(userInfo, c.env.JWT_SECRET);

    const response: LoginResponse = {
      token,
      user: userInfo
    };

    return c.json(success(response, 'Login successful'));
  } catch (err) {
    console.error('Login error:', err);
    return error('Login failed', 500);
  }
});

// 获取当前用户信息
auth.get('/me', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    return c.json(success(user));
  } catch (err) {
    console.error('Get me error:', err);
    return error('Failed to get user info', 500);
  }
});

// 用户注册（可选，根据设置开启）
auth.post('/register', async (c) => {
  try {
    // 检查是否允许注册
    const settingStmt = c.env.DB.prepare('SELECT value FROM settings WHERE key = ?');
    const allowRegistration = await settingStmt.bind('allow_registration').first<{ value: string }>();
    
    if (allowRegistration?.value !== 'true') {
      return error('Registration is disabled', 403);
    }

    const body = await c.req.json() as LoginRequest;
    const { username, password } = body;

    if (!username || !password) {
      return error('Username and password are required', 400);
    }

    if (username.length < 3 || password.length < 6) {
      return error('Username must be at least 3 characters and password at least 6 characters', 400);
    }

    // 检查用户名是否已存在
    const existingStmt = c.env.DB.prepare('SELECT id FROM users WHERE username = ?');
    const existing = await existingStmt.bind(username).first();
    
    if (existing) {
      return error('Username already exists', 409);
    }

    // 创建新用户
    const passwordHash = await hashPassword(password);
    const insertStmt = c.env.DB.prepare(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)'
    );
    
    const result = await insertStmt.bind(username, passwordHash, 'USER').run();
    
    if (!result.success) {
      return error('Failed to create user', 500);
    }

    // 获取新创建的用户
    const newUserStmt = c.env.DB.prepare('SELECT * FROM users WHERE id = ?');
    const newUser = await newUserStmt.bind(result.meta.last_row_id).first<UserWithPassword>();
    
    if (!newUser) {
      return error('Failed to retrieve new user', 500);
    }

    // 生成Token
    const userInfo: User = {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
      created_at: newUser.created_at,
      updated_at: newUser.updated_at
    };

    const token = generateToken(userInfo, c.env.JWT_SECRET);

    const response: LoginResponse = {
      token,
      user: userInfo
    };

    return c.json(success(response, 'Registration successful'), 201);
  } catch (err) {
    console.error('Registration error:', err);
    return error('Registration failed', 500);
  }
});

// 刷新Token
auth.post('/refresh', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const newToken = generateToken(user, c.env.JWT_SECRET);
    
    return c.json(success({ token: newToken }, 'Token refreshed'));
  } catch (err) {
    console.error('Token refresh error:', err);
    return error('Failed to refresh token', 500);
  }
});

export default auth; 