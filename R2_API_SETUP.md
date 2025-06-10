# R2 API 配置指南

## 概述

本项目现在支持两种方式使用Cloudflare R2存储：

1. **Workers绑定方式**（当前实现）：通过wrangler.toml配置R2绑定
2. **REST API方式**（推荐）：通过REST API直接调用R2服务

## 为什么选择REST API方式？

1. **更灵活的配置**：不需要在wrangler.toml中硬编码桶名称
2. **更好的错误处理**：可以直接处理HTTP状态码和错误信息
3. **兼容性更好**：与Memos官方的实现方式一致
4. **更容易调试**：可以直接使用HTTP工具测试

## 配置步骤

### 1. 获取R2 API凭据

在Cloudflare Dashboard中：
1. 进入 "R2 Object Storage"
2. 点击 "Manage R2 API tokens"
3. 创建新的API token，获取：
   - Account ID
   - Access Key ID
   - Secret Access Key

### 2. 创建R2存储桶

```bash
# 使用wrangler创建存储桶
wrangler r2 bucket create memos-lite-assets

# 或者在Cloudflare Dashboard中创建
```

### 3. 配置环境变量

在 `packages/api/wrangler.toml` 中设置：

```toml
[vars]
R2_ACCOUNT_ID = "your-account-id"
R2_ACCESS_KEY_ID = "your-access-key-id"
R2_SECRET_ACCESS_KEY = "your-secret-access-key"
R2_BUCKET_NAME = "memos-lite-assets"
R2_PUBLIC_URL = "https://your-domain.com"  # 你的R2公共访问域名
```

### 4. 配置自定义域名（可选但推荐）

1. 在R2存储桶设置中配置自定义域名
2. 将域名指向R2存储桶
3. 更新`R2_PUBLIC_URL`为你的自定义域名

## 实现细节

### R2 API客户端

```typescript
import { AwsClient } from 'aws4fetch';

class R2ApiClient {
  constructor(config: R2Config) {
    this.client = new AwsClient({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      region: 'auto',
      service: 's3'
    });
  }

  async putObject(key: string, body: ArrayBuffer, contentType: string) {
    const url = `https://${this.accountId}.r2.cloudflarestorage.com/${this.bucketName}/${key}`;
    const request = new Request(url, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body,
    });
    
    const signedRequest = await this.client.sign(request);
    return await fetch(signedRequest);
  }
}
```

### 使用方式

```typescript
// 在路由中使用
import { createR2Client } from '../utils/r2Client';

const r2Client = createR2Client(c.env);
const result = await r2Client.putObject(fileName, arrayBuffer, contentType);
```

## 迁移从绑定到API

如果你当前使用的是绑定方式，迁移步骤：

1. 安装aws4fetch依赖：`npm install aws4fetch`
2. 配置环境变量（见上面的步骤3）
3. 在wrangler.toml中注释掉R2绑定配置
4. 更新代码使用R2 API客户端

## 测试配置

可以使用以下代码测试R2配置：

```typescript
// 测试上传
const testFile = new TextEncoder().encode('Hello R2!');
const result = await r2Client.putObject('test.txt', testFile.buffer, 'text/plain');
console.log('Upload success:', result);

// 测试删除
const deleted = await r2Client.deleteObject('test.txt');
console.log('Delete success:', deleted);
```

## 故障排除

1. **认证错误**：检查Access Key和Secret Key是否正确
2. **存储桶不存在**：确保存储桶名称正确且已创建
3. **CORS错误**：在R2存储桶中配置适当的CORS规则
4. **域名问题**：确保自定义域名正确配置并已生效

## 性能优化

1. **使用自定义域名**：避免通过Cloudflare代理访问，直接使用R2域名
2. **合理设置缓存头**：在上传时设置适当的缓存控制头
3. **文件压缩**：对于适合的文件类型启用压缩

## 安全考虑

1. **最小权限原则**：API token只授予必要的权限
2. **密钥轮换**：定期轮换API密钥
3. **访问控制**：配置适当的存储桶访问策略
4. **监控**：设置访问日志和异常监控 