import { Hono } from 'hono';
import { Env, User, UserStats } from '../types';
import { success, error } from '../utils';
import { authMiddleware, adminMiddleware } from '../middleware';

const users = new Hono();

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