import { Hono } from 'hono';
import { Env } from './types';
import { corsMiddleware, errorMiddleware, loggerMiddleware } from './middleware';

// 导入路由模块
import authRoutes from './routes/auth';
import memoRoutes from './routes/memos';
import tagRoutes from './routes/tags';
import commentRoutes from './routes/comments';
import userRoutes from './routes/users';
import settingsRoutes from './routes/settings';
import statusRoutes from './routes/status';
import workspaceRoutes from './routes/workspace';
import resourceRoutes from './routes/resources';

// 创建Hono应用实例
const app = new Hono<{ Bindings: Env }>();

// 全局中间件
app.use('*', async (c, next) => corsMiddleware(c.env.CORS_ORIGIN)(c, next));
app.use('*', errorMiddleware);
app.use('*', loggerMiddleware);

// 健康检查
app.get('/', (c) => {
  return c.json({
    success: true,
    message: 'Memos Lite API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 路由注册
app.route('/api/v1/auth', authRoutes);
app.route('/api/v1/memos', memoRoutes);
app.route('/api/v1/tags', tagRoutes);
app.route('/api/v1/comments', commentRoutes);
app.route('/api/v1/users', userRoutes);
app.route('/api/v1/user', userRoutes);  // MoeMemos兼容路径
app.route('/api/v1/settings', settingsRoutes);
app.route('/api/v1/status', statusRoutes);
app.route('/api/v1/workspace', workspaceRoutes);
app.route('/api/v1/resources', resourceRoutes);

// 兼容旧版API路径
app.route('/api/memo', memoRoutes);

// 404处理
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Endpoint not found'
  }, 404);
});

// 导出Worker处理器
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx);
  }
}; 