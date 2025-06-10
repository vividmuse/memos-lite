import { Hono } from 'hono';
import { Env, LoginRequest, LoginResponse, User, UserWithPassword, CreateApiTokenRequest, ApiTokenResponse, ApiToken } from '../types';
import { hashPassword, verifyPassword, generateToken, generateApiToken, generateTokenId, success, error } from '../utils';
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

// 数据库初始化接口（仅在开发时使用）
auth.post('/init-db', async (c) => {
  try {
    // 检查是否已经初始化过（通过检查users表是否存在管理员用户）
    const checkAdminStmt = c.env.DB.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?');
    const adminExists = await checkAdminStmt.bind('admin').first<{ count: number }>();
    
    if (adminExists && adminExists.count > 0) {
      return error('Database already initialized', 400);
    }

    // 创建用户表（如果不存在）
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `).run();

    // 创建用户设置表
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS user_settings (
        user_id INTEGER PRIMARY KEY,
        theme TEXT DEFAULT 'light',
        language TEXT DEFAULT 'zh-CN',
        markdown_plugins TEXT DEFAULT '{}',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `).run();

    // 创建Memo表
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS memos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        visibility TEXT CHECK (visibility IN ('PUBLIC','PRIVATE')) DEFAULT 'PRIVATE',
        pinned INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `).run();

    // 创建标签表
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `).run();

    // 创建Memo与标签关联表
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS memo_tags (
        memo_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (memo_id, tag_id),
        FOREIGN KEY (memo_id) REFERENCES memos(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      )
    `).run();

    // 创建评论表
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        memo_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        parent_id INTEGER,
        content TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (memo_id) REFERENCES memos(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
      )
    `).run();

    // 创建全局设置表
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `).run();

    // 插入默认管理员用户 (admin/admin123)
    const passwordHash = await hashPassword('admin123');
    await c.env.DB.prepare(
      'INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)'
    ).bind('admin', passwordHash, 'ADMIN').run();

    // 插入默认设置
    const settingsInsert = c.env.DB.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
    await settingsInsert.bind('site_title', 'Memos Lite').run();
    await settingsInsert.bind('site_description', '轻量级备忘录系统').run();
    await settingsInsert.bind('allow_registration', 'false').run();
    await settingsInsert.bind('default_visibility', 'PRIVATE').run();

    return c.json(success(null, 'Database initialized successfully'));
  } catch (err) {
    console.error('Database initialization error:', err);
    return error('Database initialization failed', 500);
  }
});

// 调试接口 - 查看数据库中的用户（仅在开发时使用）
auth.get('/debug-users', async (c) => {
  try {
    const usersStmt = c.env.DB.prepare('SELECT id, username, role, created_at FROM users');
    const users = await usersStmt.all();
    
    return c.json(success(users.results, 'Users list'));
  } catch (err) {
    console.error('Debug users error:', err);
    return error('Failed to get users', 500);
  }
});

// 强制重新初始化数据库
auth.post('/force-init-db', async (c) => {
  try {
    // 创建用户表（如果不存在）
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `).run();

    // 创建用户设置表
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS user_settings (
        user_id INTEGER PRIMARY KEY,
        theme TEXT DEFAULT 'light',
        language TEXT DEFAULT 'zh-CN',
        markdown_plugins TEXT DEFAULT '{}',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `).run();

    // 创建Memo表
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS memos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        visibility TEXT CHECK (visibility IN ('PUBLIC','PRIVATE')) DEFAULT 'PRIVATE',
        pinned INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `).run();

    // 创建标签表
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `).run();

    // 创建Memo与标签关联表
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS memo_tags (
        memo_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (memo_id, tag_id),
        FOREIGN KEY (memo_id) REFERENCES memos(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      )
    `).run();

    // 创建评论表
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        memo_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        parent_id INTEGER,
        content TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (memo_id) REFERENCES memos(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
      )
    `).run();

    // 创建全局设置表
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `).run();

    // 插入默认管理员用户 (admin/admin123)
    const passwordHash = await hashPassword('admin123');
    await c.env.DB.prepare(
      'INSERT OR REPLACE INTO users (id, username, password_hash, role) VALUES (1, ?, ?, ?)'
    ).bind('admin', passwordHash, 'ADMIN').run();

    // 插入默认设置
    const settingsInsert = c.env.DB.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    await settingsInsert.bind('site_title', 'Memos Lite').run();
    await settingsInsert.bind('site_description', '轻量级备忘录系统').run();
    await settingsInsert.bind('allow_registration', 'false').run();
    await settingsInsert.bind('default_visibility', 'PRIVATE').run();

    return c.json(success(null, 'Database force initialized successfully'));
  } catch (err) {
    console.error('Database force initialization error:', err);
    return error('Database force initialization failed: ' + String(err), 500);
  }
});

// 完全重置数据库
auth.post('/reset-db', async (c) => {
  try {
    // 删除所有表（如果存在）
    await c.env.DB.prepare('DROP TABLE IF EXISTS memo_tags').run();
    await c.env.DB.prepare('DROP TABLE IF EXISTS comments').run();
    await c.env.DB.prepare('DROP TABLE IF EXISTS memos').run();
    await c.env.DB.prepare('DROP TABLE IF EXISTS tags').run();
    await c.env.DB.prepare('DROP TABLE IF EXISTS user_settings').run();
    await c.env.DB.prepare('DROP TABLE IF EXISTS users').run();
    await c.env.DB.prepare('DROP TABLE IF EXISTS settings').run();

    // 重新创建用户表
    await c.env.DB.prepare(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `).run();

    // 创建用户设置表
    await c.env.DB.prepare(`
      CREATE TABLE user_settings (
        user_id INTEGER PRIMARY KEY,
        theme TEXT DEFAULT 'light',
        language TEXT DEFAULT 'zh-CN',
        markdown_plugins TEXT DEFAULT '{}',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `).run();

    // 创建Memo表
    await c.env.DB.prepare(`
      CREATE TABLE memos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        visibility TEXT CHECK (visibility IN ('PUBLIC','PRIVATE')) DEFAULT 'PRIVATE',
        pinned INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `).run();

    // 创建标签表
    await c.env.DB.prepare(`
      CREATE TABLE tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `).run();

    // 创建Memo与标签关联表
    await c.env.DB.prepare(`
      CREATE TABLE memo_tags (
        memo_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (memo_id, tag_id),
        FOREIGN KEY (memo_id) REFERENCES memos(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      )
    `).run();

    // 创建评论表
    await c.env.DB.prepare(`
      CREATE TABLE comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        memo_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        parent_id INTEGER,
        content TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (memo_id) REFERENCES memos(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
      )
    `).run();

    // 创建全局设置表
    await c.env.DB.prepare(`
      CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `).run();

    // 插入默认管理员用户 (admin/admin123)
    const passwordHash = await hashPassword('admin123');
    await c.env.DB.prepare(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)'
    ).bind('admin', passwordHash, 'ADMIN').run();

    // 插入默认设置
    const settingsInsert = c.env.DB.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    await settingsInsert.bind('site_title', 'Memos Lite').run();
    await settingsInsert.bind('site_description', '轻量级备忘录系统').run();
    await settingsInsert.bind('allow_registration', 'false').run();
    await settingsInsert.bind('default_visibility', 'PRIVATE').run();

    return c.json(success(null, 'Database reset successfully'));
  } catch (err) {
    console.error('Database reset error:', err);
    return error('Database reset failed: ' + String(err), 500);
  }
});

// 创建API令牌
auth.post('/tokens', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json() as CreateApiTokenRequest;
    const { name, expires_at } = body;

    if (!name || !name.trim()) {
      return error('Token name is required', 400);
    }

    // 生成唯一的token ID
    const tokenId = generateTokenId();
    
    // 生成JWT token
    const token = generateApiToken(user, c.env.JWT_SECRET, tokenId, expires_at);

    // 保存到数据库
    const insertStmt = c.env.DB.prepare(
      'INSERT INTO api_tokens (user_id, name, token_id, expires_at) VALUES (?, ?, ?, ?)'
    );
    
    const result = await insertStmt.bind(user.id, name.trim(), tokenId, expires_at || null).run();
    
    if (!result.success) {
      return error('Failed to create token', 500);
    }

    const response: ApiTokenResponse = {
      id: result.meta.last_row_id,
      name: name.trim(),
      token: token, // 只在创建时返回完整token
      token_id: tokenId,
      created_at: Math.floor(Date.now() / 1000),
      expires_at: expires_at
    };

    return c.json(success(response, 'API token created successfully'), 201);
  } catch (err) {
    console.error('Create token error:', err);
    return error('Failed to create token', 500);
  }
});

// 获取API令牌列表
auth.get('/tokens', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    
    const stmt = c.env.DB.prepare(
      'SELECT id, name, token_id, created_at, expires_at, last_used_at FROM api_tokens WHERE user_id = ? ORDER BY created_at DESC'
    );
    
    const result = await stmt.bind(user.id).all<ApiToken>();
    
    if (!result.success) {
      return error('Failed to fetch tokens', 500);
    }

    return c.json(success(result.results || []));
  } catch (err) {
    console.error('Get tokens error:', err);
    return error('Failed to fetch tokens', 500);
  }
});

// 删除API令牌
auth.delete('/tokens/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const tokenId = parseInt(c.req.param('id'));

    if (isNaN(tokenId)) {
      return error('Invalid token ID', 400);
    }

    // 检查token是否属于当前用户
    const checkStmt = c.env.DB.prepare('SELECT id FROM api_tokens WHERE id = ? AND user_id = ?');
    const existing = await checkStmt.bind(tokenId, user.id).first();
    
    if (!existing) {
      return error('Token not found', 404);
    }

    // 删除token
    const deleteStmt = c.env.DB.prepare('DELETE FROM api_tokens WHERE id = ? AND user_id = ?');
    const result = await deleteStmt.bind(tokenId, user.id).run();
    
    if (!result.success) {
      return error('Failed to delete token', 500);
    }

    return c.json(success(null, 'Token deleted successfully'));
  } catch (err) {
    console.error('Delete token error:', err);
    return error('Failed to delete token', 500);
  }
});

export default auth; 