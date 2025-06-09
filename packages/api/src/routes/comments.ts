import { Hono } from 'hono';
import { Env, Comment, CreateCommentRequest } from '../types';
import { success, error, getCurrentTimestamp, sanitizeMarkdown } from '../utils';
import { authMiddleware, optionalAuthMiddleware } from '../middleware';

const comments = new Hono<{ Bindings: Env }>();

// 获取memo的评论
comments.get('/memo/:memoId', optionalAuthMiddleware, async (c) => {
  try {
    const memoId = parseInt(c.req.param('memoId'));
    const currentUser = c.get('user');
    
    // 检查memo是否存在和可访问
    const memoQuery = 'SELECT visibility, user_id FROM memos WHERE id = ?';
    const memo = await c.env.DB.prepare(memoQuery).bind(memoId).first<{ visibility: string; user_id: number }>();
    
    if (!memo) {
      return error('Memo not found', 404);
    }
    
    if (memo.visibility === 'PRIVATE' && (!currentUser || currentUser.id !== memo.user_id)) {
      return error('Access denied', 403);
    }
    
    // 获取评论
    const query = `
      SELECT c.*, u.username 
      FROM comments c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.memo_id = ? 
      ORDER BY c.created_at ASC
    `;
    
    const result = await c.env.DB.prepare(query).bind(memoId).all<Comment & { username: string }>();
    
    return c.json(success(result.results || []));
  } catch (err) {
    console.error('Get comments error:', err);
    return error('Failed to get comments', 500);
  }
});

// 创建评论
comments.post('/memo/:memoId', authMiddleware, async (c) => {
  try {
    const memoId = parseInt(c.req.param('memoId'));
    const body = await c.req.json() as CreateCommentRequest;
    const { content, parent_id } = body;
    const currentUser = c.get('user');
    
    if (!content || content.trim().length === 0) {
      return error('Content is required', 400);
    }
    
    // 检查memo是否存在
    const memoQuery = 'SELECT id FROM memos WHERE id = ?';
    const memo = await c.env.DB.prepare(memoQuery).bind(memoId).first();
    
    if (!memo) {
      return error('Memo not found', 404);
    }
    
    const sanitizedContent = sanitizeMarkdown(content);
    const timestamp = getCurrentTimestamp();
    
    const insertQuery = `
      INSERT INTO comments (memo_id, user_id, parent_id, content, created_at) 
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const result = await c.env.DB.prepare(insertQuery).bind(
      memoId,
      currentUser.id,
      parent_id || null,
      sanitizedContent,
      timestamp
    ).run();
    
    if (!result.success) {
      return error('Failed to create comment', 500);
    }
    
    // 获取创建的评论
    const getCommentQuery = `
      SELECT c.*, u.username 
      FROM comments c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.id = ?
    `;
    
    const newComment = await c.env.DB.prepare(getCommentQuery).bind(result.meta.last_row_id).first<Comment & { username: string }>();
    
    return c.json(success(newComment, 'Comment created successfully'), 201);
  } catch (err) {
    console.error('Create comment error:', err);
    return error('Failed to create comment', 500);
  }
});

export default comments; 