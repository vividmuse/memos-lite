import { Hono } from 'hono';

const workspace = new Hono();

// 工作区配置端点 - MoeMemos客户端兼容
workspace.get('/profile', async (c) => {
  try {
    // 工作区配置信息
    const workspaceProfile = {
      name: 'memos-lite',
      version: '0.24.4',
      mode: 'prod',
      allowSignUp: false,
      disablePasswordLogin: false,
      additionalScript: '',
      additionalStyle: '',
      customizedProfile: {
        title: 'Memos Lite',
        description: '轻量级备忘录系统',
        logoUrl: '',
        locale: 'zh-CN',
        appearance: 'system',
        externalUrl: ''
      },
      storageServiceId: '',
      enableTelegramIntegration: false
    };

    return c.json(workspaceProfile);
  } catch (err) {
    console.error('Get workspace profile error:', err);
    return c.json({
      error: 'Failed to get workspace profile',
      code: 500
    }, 500);
  }
});

export default workspace; 