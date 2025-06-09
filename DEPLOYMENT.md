# Memos Lite 部署指南

## 概述

Memos Lite 是一个基于 Cloudflare Workers 和 React 的轻量级备忘录系统。本指南将帮助您在 Cloudflare 平台上部署完整的应用程序。

## 架构

- **后端**: Cloudflare Workers + D1 数据库
- **前端**: React + TypeScript + Tailwind CSS (部署到 Cloudflare Pages)

## 部署步骤

### 1. 后端部署 (Cloudflare Workers)

#### 前置条件
- Cloudflare 账户
- 安装 Node.js (18+) 和 pnpm
- 安装 Wrangler CLI: `npm install -g wrangler`

#### 部署步骤

1. **登录 Cloudflare**
   ```bash
   wrangler auth login
   ```

2. **创建 D1 数据库**
   ```bash
   cd packages/api
   wrangler d1 create memos-lite
   ```
   
   复制输出的数据库 ID，并更新 `wrangler.toml` 中的数据库配置。

3. **初始化数据库结构**
   ```bash
   wrangler d1 execute memos-lite --file=./database/schema.sql
   ```

4. **部署 Worker**
   ```bash
   pnpm run deploy
   ```

5. **记录 Worker URL**
   部署成功后，记录您的 Worker URL (例如: `https://memos-lite.your-subdomain.workers.dev`)

### 2. 前端部署 (Cloudflare Pages)

#### 方法 A: 通过 GitHub 自动部署 (推荐)

1. **在 Cloudflare Dashboard 中:**
   - 进入 Pages 选项
   - 点击 "Connect to Git"
   - 选择您的 GitHub 仓库
   - 配置构建设置:
     - **Framework preset**: React
     - **Build command**: `cd packages/web && pnpm install && pnpm run build`
     - **Build output directory**: `packages/web/dist`
     - **Root directory**: `/` (项目根目录)

2. **配置环境变量:**
   在 Pages 项目设置中添加:
   ```
   VITE_API_URL=https://your-worker.your-subdomain.workers.dev
   VITE_APP_NAME=Memos Lite
   ```

3. **部署**
   推送代码到 GitHub，Cloudflare Pages 将自动构建和部署。

#### 方法 B: 手动部署

1. **构建前端**
   ```bash
   cd packages/web
   cp env.example .env
   # 编辑 .env 文件，设置正确的 API URL
   pnpm install
   pnpm run build
   ```

2. **部署到 Pages**
   ```bash
   wrangler pages publish dist --project-name=memos-lite
   ```

### 3. 配置自定义域名 (可选)

1. 在 Cloudflare Dashboard 中为 Worker 和 Pages 配置自定义域名
2. 更新前端环境变量中的 API URL

### 4. 初始设置

1. **访问前端应用**
2. **注册管理员账户** (第一个注册的用户自动成为管理员)
3. **配置系统设置** (在设置页面中)

## 环境变量

### 后端 (Worker)
在 `wrangler.toml` 中配置:
```toml
[env.production.vars]
JWT_SECRET = "your-super-secret-jwt-key-here"
ADMIN_EMAIL = "admin@example.com"
```

### 前端 (Pages)
在 Cloudflare Pages 设置或 `.env` 文件中:
```
VITE_API_URL=https://your-worker.your-subdomain.workers.dev
VITE_APP_NAME=Memos Lite
```

## 故障排除

### 数据库连接问题
- 确保 D1 数据库 ID 在 `wrangler.toml` 中正确配置
- 验证数据库结构是否正确执行

### CORS 问题
- 确保 Worker 中的 CORS 配置包含了前端域名
- 检查 `packages/api/src/utils.ts` 中的 `corsHeaders` 配置

### 构建失败
- 确保使用正确的 Node.js 版本 (18+)
- 验证所有依赖项已正确安装

## 监控和维护

- 使用 Cloudflare Dashboard 监控 Worker 和 Pages 的性能
- 定期检查错误日志
- 根据需要更新环境变量和配置

## 安全建议

1. **更换默认密钥**: 在生产环境中更换 JWT_SECRET
2. **设置强密码策略**: 确保用户使用强密码
3. **定期备份**: 考虑定期导出 D1 数据库数据
4. **访问控制**: 根据需要配置私有/公开备忘录的默认设置

## 开发环境

如需本地开发:

1. **后端开发**
   ```bash
   cd packages/api
   pnpm install
   pnpm run dev
   ```

2. **前端开发**
   ```bash
   cd packages/web
   pnpm install
   pnpm run dev
   ```

确保在 `.env` 文件中配置正确的 API URL。 