import { Hono } from 'hono';
import { Env, Settings } from '../types';
import { success, error } from '../utils';
import { authMiddleware, adminMiddleware } from '../middleware';

const settings = new Hono<{ Bindings: Env }>();

// 获取公开设置
settings.get('/public', async (c) => {
  try {
    const query = 'SELECT key, value FROM settings WHERE key IN (?, ?, ?)';
    const result = await c.env.DB.prepare(query).bind(
      'site_title',
      'site_description', 
      'allow_registration'
    ).all<{ key: string; value: string }>();
    
    const publicSettings: any = {};
    (result.results || []).forEach(row => {
      publicSettings[row.key] = row.value;
    });
    
    return c.json(success(publicSettings));
  } catch (err) {
    console.error('Get public settings error:', err);
    return error('Failed to get settings', 500);
  }
});

// 获取所有设置（仅管理员）
settings.get('/', authMiddleware, adminMiddleware, async (c) => {
  try {
    const query = 'SELECT key, value FROM settings';
    const result = await c.env.DB.prepare(query).all<{ key: string; value: string }>();
    
    const allSettings: any = {};
    (result.results || []).forEach(row => {
      allSettings[row.key] = row.value;
    });
    
    return c.json(success(allSettings));
  } catch (err) {
    console.error('Get settings error:', err);
    return error('Failed to get settings', 500);
  }
});

// 更新设置（仅管理员）
settings.put('/', authMiddleware, adminMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    
    for (const [key, value] of Object.entries(body)) {
      const updateQuery = 'UPDATE settings SET value = ?, updated_at = ? WHERE key = ?';
      await c.env.DB.prepare(updateQuery).bind(
        value as string,
        Math.floor(Date.now() / 1000),
        key
      ).run();
    }
    
    return c.json(success(null, 'Settings updated successfully'));
  } catch (err) {
    console.error('Update settings error:', err);
    return error('Failed to update settings', 500);
  }
});

export default settings; 