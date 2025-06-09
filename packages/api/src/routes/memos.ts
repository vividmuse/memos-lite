import { Hono } from 'hono';
import { Env, Memo, CreateMemoRequest, UpdateMemoRequest } from '../types';
import { success, error, getCurrentTimestamp, sanitizeMarkdown } from '../utils';
import { authMiddleware, optionalAuthMiddleware } from '../middleware';

const memos = new Hono<{ Bindings: Env }>();

// 获取memo列表
memos.get('/', optionalAuthMiddleware, async (c) => {
  try {
    const query = 'SELECT m.*, u.username FROM memos m JOIN users u ON m.user_id = u.id WHERE m.visibility = "PUBLIC" ORDER BY m.created_at DESC LIMIT 20';
    const result = await c.env.DB.prepare(query).all<Memo>();
    return c.json(success(result.results || []));
  } catch (err) {
    return error('Failed to get memos', 500);
  }
});

// 创建memo
memos.post('/', authMiddleware, async (c) => {
  try {
    const body = await c.req.json() as CreateMemoRequest;
    const currentUser = c.get('user');
    
    const insertQuery = 'INSERT INTO memos (user_id, content, visibility, created_at, updated_at) VALUES (?, ?, ?, ?, ?)';
    const timestamp = getCurrentTimestamp();
    
    const result = await c.env.DB.prepare(insertQuery).bind(
      currentUser.id,
      sanitizeMarkdown(body.content),
      body.visibility || 'PRIVATE',
      timestamp,
      timestamp
    ).run();
    
    return c.json(success({ id: result.meta.last_row_id }, 'Memo created'), 201);
  } catch (err) {
    return error('Failed to create memo', 500);
  }
});

export default memos;