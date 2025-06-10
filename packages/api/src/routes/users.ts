import { Hono } from 'hono';
import { Env, User, UserStats, UserWithPassword } from '../types';
import { success, error, hashPassword, verifyPassword } from '../utils';
import { authMiddleware, adminMiddleware } from '../middleware';

const users = new Hono<{ Bindings: Env }>;

// 获取当前用户信息 - MoeMemos客户端兼容
users.get('/me', authMiddleware, async (c) => {
  try {
    const currentUser = c.get('user');
    
    // MoeMemos 1.7.2 + Memos 0.24.0 兼容格式
    const userInfo = {
      id: currentUser.id,
      name: currentUser.username, // MoeMemos 期望的是 name 字段
      username: currentUser.username,
      email: "", // 空字符串，MoeMemos 可能期望这个字段
      nickname: currentUser.username,
      role: currentUser.role,
      avatarUrl: "",
      createdTs: (currentUser.created_at || Math.floor(Date.now() / 1000)) * 1000, // 转换为毫秒级时间戳
      updatedTs: (currentUser.updated_at || Math.floor(Date.now() / 1000)) * 1000, // 转换为毫秒级时间戳
      setting: {
        locale: "zh-CN",
        appearance: "system",
        memoVisibility: "PRIVATE"
      }
    };
    
    // 直接返回用户对象，兼容 MoeMemos 客户端
    return c.json(userInfo);
  } catch (err) {
    console.error('Get current user error:', err);
    return c.json({ message: 'Failed to get user info' }, 500);
  }
});

// 修改密码
users.put('/:id/password', authMiddleware, async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));
    const currentUser = c.get('user');
    const body = await c.req.json();
    
    const { currentPassword, newPassword } = body;
    
    if (!currentPassword || !newPassword) {
      return error('Current password and new password are required', 400);
    }
    
    if (newPassword.length < 6) {
      return error('New password must be at least 6 characters', 400);
    }
    
    // 检查权限：用户只能修改自己的密码，管理员可以修改任何用户的密码
    if (currentUser.id !== userId && currentUser.role !== 'ADMIN') {
      return error('Access denied', 403);
    }
    
    // 如果是普通用户修改自己的密码，需要验证当前密码
    if (currentUser.id === userId) {
      const user = await c.env.DB.prepare('SELECT password_hash FROM users WHERE id = ?').bind(userId).first<{ password_hash: string }>();
      
      if (!user) {
        return error('User not found', 404);
      }
      
      const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password_hash);
      if (!isCurrentPasswordValid) {
        return error('Current password is incorrect', 400);
      }
    }
    
    // 更新密码
    const newPasswordHash = await hashPassword(newPassword);
    await c.env.DB.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
      .bind(newPasswordHash, Math.floor(Date.now() / 1000), userId)
      .run();
    
    return c.json(success({ message: 'Password updated successfully' }));
  } catch (err) {
    console.error('Update password error:', err);
    return error('Failed to update password', 500);
  }
});

// 创建用户（仅管理员）
users.post('/', authMiddleware, adminMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { username, password, role = 'USER' } = body;
    
    if (!username || !password) {
      return error('Username and password are required', 400);
    }
    
    if (username.length < 3 || password.length < 6) {
      return error('Username must be at least 3 characters and password at least 6 characters', 400);
    }
    
    if (!['USER', 'ADMIN'].includes(role)) {
      return error('Invalid role. Must be USER or ADMIN', 400);
    }
    
    // 检查用户名是否已存在
    const existingUser = await c.env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
    if (existingUser) {
      return error('Username already exists', 400);
    }
    
    // 创建用户
    const passwordHash = await hashPassword(password);
    const timestamp = Math.floor(Date.now() / 1000);
    
    const result = await c.env.DB.prepare(
      'INSERT INTO users (username, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(username, passwordHash, role, timestamp, timestamp).run();
    
    // 返回新创建的用户信息（不包含密码）
    const newUser = await c.env.DB.prepare(
      'SELECT id, username, role, created_at, updated_at FROM users WHERE id = ?'
    ).bind(result.meta.last_row_id).first<User>();
    
    return c.json(success(newUser), 201);
  } catch (err) {
    console.error('Create user error:', err);
    return error('Failed to create user', 500);
  }
});

// 更新用户信息（仅管理员）
users.put('/:id', authMiddleware, adminMiddleware, async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const { username, role, password } = body;
    
    // 检查用户是否存在
    const existingUser = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<User>();
    if (!existingUser) {
      return error('User not found', 404);
    }
    
    const updates = [];
    const params = [];
    
    // 更新用户名
    if (username && username !== existingUser.username) {
      if (username.length < 3) {
        return error('Username must be at least 3 characters', 400);
      }
      
      // 检查新用户名是否已被使用
      const usernameCheck = await c.env.DB.prepare('SELECT id FROM users WHERE username = ? AND id != ?')
        .bind(username, userId).first();
      if (usernameCheck) {
        return error('Username already exists', 400);
      }
      
      updates.push('username = ?');
      params.push(username);
    }
    
    // 更新角色
    if (role && role !== existingUser.role) {
      if (!['USER', 'ADMIN'].includes(role)) {
        return error('Invalid role. Must be USER or ADMIN', 400);
      }
      
      updates.push('role = ?');
      params.push(role);
    }
    
    // 更新密码
    if (password) {
      if (password.length < 6) {
        return error('Password must be at least 6 characters', 400);
      }
      
      const passwordHash = await hashPassword(password);
      updates.push('password_hash = ?');
      params.push(passwordHash);
    }
    
    if (updates.length === 0) {
      return error('No fields to update', 400);
    }
    
    // 添加更新时间
    updates.push('updated_at = ?');
    params.push(Math.floor(Date.now() / 1000));
    params.push(userId);
    
    // 执行更新
    await c.env.DB.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...params).run();
    
    // 返回更新后的用户信息
    const updatedUser = await c.env.DB.prepare(
      'SELECT id, username, role, created_at, updated_at FROM users WHERE id = ?'
    ).bind(userId).first<User>();
    
    return c.json(success(updatedUser));
  } catch (err) {
    console.error('Update user error:', err);
    return error('Failed to update user', 500);
  }
});

// 删除用户（仅管理员）
users.delete('/:id', authMiddleware, adminMiddleware, async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));
    const currentUser = c.get('user');
    
    // 防止管理员删除自己
    if (currentUser.id === userId) {
      return error('Cannot delete your own account', 400);
    }
    
    // 检查用户是否存在
    const existingUser = await c.env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(userId).first();
    if (!existingUser) {
      return error('User not found', 404);
    }
    
    // 删除用户相关数据（级联删除）
    await c.env.DB.prepare('DELETE FROM comments WHERE user_id = ?').bind(userId).run();
    await c.env.DB.prepare('DELETE FROM memos WHERE user_id = ?').bind(userId).run();
    await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
    
    return c.json(success({ message: 'User deleted successfully' }));
  } catch (err) {
    console.error('Delete user error:', err);
    return error('Failed to delete user', 500);
  }
});

// 获取用户统计
users.get('/:id/stats', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));
    
    // 获取基本统计
    const memoCountQuery = 'SELECT COUNT(*) as count FROM memos WHERE user_id = ?';
    const memoCount = await c.env.DB.prepare(memoCountQuery).bind(userId).first<{ count: number }>();
    
    const tagCountQuery = `
      SELECT COUNT(DISTINCT t.id) as count 
      FROM tags t 
      JOIN memo_tags mt ON t.id = mt.tag_id 
      JOIN memos m ON mt.memo_id = m.id 
      WHERE m.user_id = ?
    `;
    const tagCount = await c.env.DB.prepare(tagCountQuery).bind(userId).first<{ count: number }>();
    
    const commentCountQuery = 'SELECT COUNT(*) as count FROM comments WHERE user_id = ?';
    const commentCount = await c.env.DB.prepare(commentCountQuery).bind(userId).first<{ count: number }>();
    
    const stats: UserStats = {
      totalMemos: memoCount?.count || 0,
      totalTags: tagCount?.count || 0,
      totalComments: commentCount?.count || 0
    };
    
    return c.json(success(stats));
  } catch (err) {
    console.error('Get user stats error:', err);
    return error('Failed to get user stats', 500);
  }
});

// 获取所有用户（仅管理员）
users.get('/', authMiddleware, adminMiddleware, async (c) => {
  try {
    const query = 'SELECT id, username, role, created_at, updated_at FROM users ORDER BY created_at DESC';
    const result = await c.env.DB.prepare(query).all<User>();
    
    return c.json(success(result.results || []));
  } catch (err) {
    console.error('Get users error:', err);
    return error('Failed to get users', 500);
  }
});

export default users; 