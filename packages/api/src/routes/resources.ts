import { Hono } from 'hono';
import { Env } from '../types';
import { success, error, getCurrentTimestamp } from '../utils';
import { authMiddleware } from '../middleware';

const resources = new Hono();

// 生成随机文件名
function generateRandomFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop() || '';
  return `${timestamp}_${randomStr}.${extension}`;
}

// 上传文件到 R2
resources.post('/', authMiddleware, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json(error('No file provided', 400));
    }

    // 检查文件大小 (限制 32MB)
    const maxSize = 32 * 1024 * 1024; // 32MB
    if (file.size > maxSize) {
      return c.json(error('File too large. Maximum size is 32MB', 413));
    }

    // 检查文件类型
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'text/plain', 'text/markdown', 'application/pdf',
      'application/json', 'application/xml'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return c.json(error('File type not allowed', 415));
    }

    // 生成随机文件名
    const fileName = generateRandomFileName(file.name);
    const currentUser = c.get('user');
    
    // 上传到 R2
    const arrayBuffer = await file.arrayBuffer();
    const uploadResult = await c.env.R2_BUCKET.put(fileName, arrayBuffer, {
      customMetadata: {
        'original-name': file.name,
        'content-type': file.type,
        'uploaded-by': currentUser.username,
        'uploaded-at': getCurrentTimestamp().toString()
      }
    });

    if (!uploadResult) {
      return c.json(error('Failed to upload file', 500));
    }

    // 保存文件信息到数据库
    const insertQuery = `
      INSERT INTO resources (filename, original_name, content_type, size, user_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const result = await c.env.DB.prepare(insertQuery).bind(
      fileName,
      file.name,
      file.type,
      file.size,
      currentUser.id,
      getCurrentTimestamp()
    ).run();

    // 构建文件访问URL
    const fileUrl = `${c.env.R2_PUBLIC_URL}/${fileName}`;
    
    const resourceInfo = {
      id: result.meta.last_row_id,
      filename: fileName,
      originalName: file.name,
      contentType: file.type,
      size: file.size,
      url: fileUrl,
      createdAt: getCurrentTimestamp()
    };

    return c.json(success(resourceInfo, 'File uploaded successfully'), 201);
  } catch (err) {
    console.error('Upload file error:', err);
    return c.json(error('Failed to upload file', 500));
  }
});

// 获取文件列表
resources.get('/', authMiddleware, async (c) => {
  try {
    const currentUser = c.get('user');
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '20')));
    const offset = Math.max(0, parseInt(c.req.query('offset') || '0'));
    
    const query = `
      SELECT * FROM resources 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    const result = await c.env.DB.prepare(query).bind(
      currentUser.id,
      limit,
      offset
    ).all();

    const resources = (result.results || []).map((resource: any) => ({
      ...resource,
      url: `${c.env.R2_PUBLIC_URL}/${resource.filename}`
    }));

    return c.json(success(resources));
  } catch (err) {
    console.error('Get resources error:', err);
    return c.json(error('Failed to get resources', 500));
  }
});

// 删除文件
resources.delete('/:id', authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const currentUser = c.get('user');
    
    // 获取文件信息
    const fileQuery = 'SELECT * FROM resources WHERE id = ? AND user_id = ?';
    const fileInfo = await c.env.DB.prepare(fileQuery).bind(id, currentUser.id).first();
    
    if (!fileInfo) {
      return c.json(error('File not found or access denied', 404));
    }

    // 从 R2 删除文件
    await c.env.R2_BUCKET.delete(fileInfo.filename);
    
    // 从数据库删除记录
    await c.env.DB.prepare('DELETE FROM resources WHERE id = ?').bind(id).run();

    return c.json(success(null, 'File deleted successfully'));
  } catch (err) {
    console.error('Delete file error:', err);
    return c.json(error('Failed to delete file', 500));
  }
});

export default resources; 