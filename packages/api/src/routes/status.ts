import { Hono } from 'hono';

const status = new Hono();

// 系统状态端点 - MoeMemos客户端兼容
status.get('/', async (c) => {
  try {
    // 获取系统信息和版本
    const statusInfo = {
      host: 'memos-lite',
      profile: {
        mode: 'prod',
        version: '0.24.4', // 与官方memos兼容的版本号
        data: '/var/opt/memos', // 数据目录
        dsn: 'cloudflare-d1', // 数据库类型
        addr: '0.0.0.0',
        port: 5230,
        driver: 'd1'
      },
      db: {
        type: 'cloudflare-d1'
      },
      allowSignUp: false, // 根据设置决定
      additionalScript: '',
      additionalStyle: '',
      disablePasswordLogin: false,
      disablePublicMemos: false,
      maxUploadSizeMiB: 32,
      enableWebhook: false,
      memo: {
        displayWithUpdatedTs: false,
        enableComment: true,
        enableAutoCompact: false,
        enableDoubleClickEdit: true,
        enableLinkPreview: true,
        enableAutoSave: true,
        enableLocationService: false,
        enableTagSuggestion: true
      },
      customizedProfile: {
        title: 'Memos Lite',
        description: '轻量级备忘录系统',
        logoUrl: '',
        locale: 'zh-CN',
        appearance: 'system',
        externalUrl: ''
      }
    };

    return c.json(statusInfo);
  } catch (err) {
    console.error('Get status error:', err);
    return c.json({
      error: 'Failed to get status',
      code: 500
    }, 500);
  }
});

export default status; 