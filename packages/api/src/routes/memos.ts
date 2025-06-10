import { Hono } from 'hono';
import { Env, Memo, CreateMemoRequest, UpdateMemoRequest } from '../types';
import { success, error, getCurrentTimestamp, sanitizeMarkdown, extractTagsFromContent } from '../utils';
import { authMiddleware, optionalAuthMiddleware } from '../middleware';

const memos = new Hono<{ Bindings: Env }>();

// 获取memo列表
memos.get('/', optionalAuthMiddleware, async (c) => {
  try {
    const currentUser = c.get('user');
    const url = new URL(c.req.url);
    
    // 解析查询参数
    const visibility = url.searchParams.get('visibility');
    const tag = url.searchParams.get('tag');
    const search = url.searchParams.get('search');
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50')));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));
    
    let whereConditions = [];
    let queryParams = [];
    
    // 构建查询条件
    if (currentUser) {
      // 已登录用户：可以看到自己的所有memo和其他人的公开memo
      if (visibility === 'PUBLIC') {
        whereConditions.push('m.visibility = ?');
        queryParams.push('PUBLIC');
      } else if (visibility === 'PRIVATE') {
        whereConditions.push('m.visibility = ? AND m.user_id = ?');
        queryParams.push('PRIVATE', currentUser.id);
      } else {
        // 默认：用户自己的所有memo + 其他人的公开memo
        whereConditions.push('(m.user_id = ? OR m.visibility = "PUBLIC")');
        queryParams.push(currentUser.id);
      }
    } else {
      // 未登录用户：只能看到公开memo
      whereConditions.push('m.visibility = ?');
      queryParams.push('PUBLIC');
    }
    
    // 标签过滤
    if (tag) {
      whereConditions.push('m.content LIKE ?');
      queryParams.push(`%#${tag}%`);
    }
    
    // 搜索过滤
    if (search) {
      whereConditions.push('m.content LIKE ?');
      queryParams.push(`%${search}%`);
    }
    
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    
    const query = `
      SELECT m.*, u.username 
      FROM memos m 
      JOIN users u ON m.user_id = u.id 
      ${whereClause}
      ORDER BY m.pinned DESC, m.created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    queryParams.push(limit, offset);
    
    const result = await c.env.DB.prepare(query).bind(...queryParams).all<Memo & { username: string }>();
    
    // 直接返回备忘录数组，兼容 MoeMemos 客户端
    return c.json(result.results || []);
  } catch (err) {
    console.error('Get memos error:', err);
    return error('Failed to get memos', 500);
  }
});

// 获取单个memo
memos.get('/:id', optionalAuthMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const currentUser = c.get('user');
    
    const query = 'SELECT m.*, u.username FROM memos m JOIN users u ON m.user_id = u.id WHERE m.id = ?';
    const memo = await c.env.DB.prepare(query).bind(id).first<Memo & { username: string }>();
    
    if (!memo) {
      return error('Memo not found', 404);
    }
    
    // 检查访问权限
    if (memo.visibility === 'PRIVATE' && (!currentUser || currentUser.id !== memo.user_id)) {
      return error('Access denied', 403);
    }
    
    // 直接返回备忘录对象，兼容 MoeMemos 客户端
    return c.json(memo);
  } catch (err) {
    console.error('Get memo error:', err);
    return error('Failed to get memo', 500);
  }
});

// 创建memo
memos.post('/', authMiddleware, async (c) => {
  try {
    const body = await c.req.json() as CreateMemoRequest;
    const currentUser = c.get('user');
    
    const content = sanitizeMarkdown(body.content);
    const visibility = body.visibility || 'PRIVATE';
    const pinned = body.pinned ? 1 : 0;
    
    const insertQuery = 'INSERT INTO memos (user_id, content, visibility, pinned, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)';
    const timestamp = getCurrentTimestamp();
    
    const result = await c.env.DB.prepare(insertQuery).bind(
      currentUser.id,
      content,
      visibility,
      pinned,
      timestamp,
      timestamp
    ).run();
    
    // 处理标签
    const tags = extractTagsFromContent(content);
    if (tags.length > 0) {
      for (const tagName of tags) {
        // 确保标签存在
        await c.env.DB.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)').bind(tagName).run();
        
        // 关联memo和标签
        await c.env.DB.prepare('INSERT OR IGNORE INTO memo_tags (memo_id, tag_id) VALUES (?, (SELECT id FROM tags WHERE name = ?))').bind(
          result.meta.last_row_id,
          tagName
        ).run();
      }
    }
    
    // 返回新创建的memo
    const newMemo = await c.env.DB.prepare('SELECT m.*, u.username FROM memos m JOIN users u ON m.user_id = u.id WHERE m.id = ?').bind(result.meta.last_row_id).first<Memo & { username: string }>();
    
    // 直接返回新创建的备忘录，兼容 MoeMemos 客户端
    return c.json(newMemo, 201);
  } catch (err) {
    console.error('Create memo error:', err);
    return error('Failed to create memo', 500);
  }
});

// 更新memo
memos.put('/:id', authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json() as UpdateMemoRequest;
    const currentUser = c.get('user');
    
    // 检查memo是否存在且属于当前用户
    const existingMemo = await c.env.DB.prepare('SELECT * FROM memos WHERE id = ? AND user_id = ?').bind(id, currentUser.id).first<Memo>();
    
    if (!existingMemo) {
      return error('Memo not found or access denied', 404);
    }
    
    const content = body.content ? sanitizeMarkdown(body.content) : existingMemo.content;
    const visibility = body.visibility || existingMemo.visibility;
    const pinned = body.pinned !== undefined ? (body.pinned ? 1 : 0) : existingMemo.pinned;
    
    const updateQuery = 'UPDATE memos SET content = ?, visibility = ?, pinned = ?, updated_at = ? WHERE id = ?';
    const timestamp = getCurrentTimestamp();
    
    await c.env.DB.prepare(updateQuery).bind(
      content,
      visibility,
      pinned,
      timestamp,
      id
    ).run();
    
    // 更新标签关联
    if (body.content) {
      // 删除旧的标签关联
      await c.env.DB.prepare('DELETE FROM memo_tags WHERE memo_id = ?').bind(id).run();
      
      // 添加新的标签关联
      const tags = extractTagsFromContent(content);
      if (tags.length > 0) {
        for (const tagName of tags) {
          await c.env.DB.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)').bind(tagName).run();
          await c.env.DB.prepare('INSERT OR IGNORE INTO memo_tags (memo_id, tag_id) VALUES (?, (SELECT id FROM tags WHERE name = ?))').bind(
            id,
            tagName
          ).run();
        }
      }
    }
    
    // 返回更新后的memo
    const updatedMemo = await c.env.DB.prepare('SELECT m.*, u.username FROM memos m JOIN users u ON m.user_id = u.id WHERE m.id = ?').bind(id).first<Memo & { username: string }>();
    
    // 直接返回更新后的备忘录，兼容 MoeMemos 客户端
    return c.json(updatedMemo);
  } catch (err) {
    console.error('Update memo error:', err);
    return error('Failed to update memo', 500);
  }
});

// 删除memo
memos.delete('/:id', authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const currentUser = c.get('user');
    
    // 检查memo是否存在且属于当前用户（或用户是管理员）
    const memo = await c.env.DB.prepare('SELECT * FROM memos WHERE id = ?').bind(id).first<Memo>();
    
    if (!memo) {
      return error('Memo not found', 404);
    }
    
    if (memo.user_id !== currentUser.id && currentUser.role !== 'ADMIN') {
      return error('Access denied', 403);
    }
    
    // 删除标签关联
    await c.env.DB.prepare('DELETE FROM memo_tags WHERE memo_id = ?').bind(id).run();
    
    // 删除评论
    await c.env.DB.prepare('DELETE FROM comments WHERE memo_id = ?').bind(id).run();
    
    // 删除memo
    await c.env.DB.prepare('DELETE FROM memos WHERE id = ?').bind(id).run();
    
    // 返回空对象表示删除成功，兼容 MoeMemos 客户端
    return c.json({});
  } catch (err) {
    console.error('Delete memo error:', err);
    return error('Failed to delete memo', 500);
  }
});

export default memos;