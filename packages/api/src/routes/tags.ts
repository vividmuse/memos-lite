import { Hono } from 'hono';
import { Env, Tag } from '../types';
import { success, error } from '../utils';
import { optionalAuthMiddleware } from '../middleware';

const tags = new Hono<{ Bindings: Env }>();

// 获取所有标签
tags.get('/', optionalAuthMiddleware, async (c) => {
  try {
    const query = `
      SELECT t.*, COUNT(mt.memo_id) as memo_count 
      FROM tags t 
      LEFT JOIN memo_tags mt ON t.id = mt.tag_id 
      GROUP BY t.id 
      ORDER BY memo_count DESC, t.name
    `;
    
    const result = await c.env.DB.prepare(query).all<Tag & { memo_count: number }>();
    
    return c.json(success(result.results || []));
  } catch (err) {
    console.error('Get tags error:', err);
    return error('Failed to get tags', 500);
  }
});

export default tags; 