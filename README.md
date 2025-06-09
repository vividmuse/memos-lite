# Memos Lite

轻量级备忘录系统，基于 Cloudflare Workers + React 构建，支持 Markdown 编辑、标签管理、评论系统等功能。

## 项目特性

- **后端 API**：基于 Cloudflare Workers + D1 数据库
- **前端界面**：React + TypeScript，现代化响应式设计
- **Markdown 支持**：完整的 Markdown 编辑和预览
- **标签系统**：支持标签管理和过滤
- **评论功能**：支持嵌套评论
- **用户管理**：支持多用户，角色权限控制
- **数据统计**：提供用户和系统统计信息

## 技术栈

### 后端
- **Cloudflare Workers**: 边缘计算平台
- **D1 Database**: Cloudflare 的 SQLite 数据库
- **Hono**: 轻量级 Web 框架
- **JWT**: 用户认证
- **bcryptjs**: 密码加密

### 前端
- **React 18**: 用户界面库
- **TypeScript**: 类型安全
- **Vite**: 构建工具
- **Tailwind CSS**: 样式框架
- **React Router**: 路由管理

## 项目结构

```
memos-lite/
├── packages/
│   ├── api/                 # Cloudflare Worker 后端
│   │   ├── src/
│   │   │   ├── routes/      # API 路由
│   │   │   ├── types.ts     # 类型定义
│   │   │   ├── utils.ts     # 工具函数
│   │   │   ├── middleware.ts # 中间件
│   │   │   └── index.ts     # 入口文件
│   │   ├── schema.sql       # 数据库 Schema
│   │   ├── wrangler.toml    # Cloudflare 配置
│   │   └── package.json
│   ├── web/                 # React 前端应用
│   └── shared/              # 共享类型和工具
├── scripts/                 # 部署和工具脚本
└── package.json            # 根项目配置
```

## API 端点

### 认证相关
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/register` - 用户注册（可配置关闭）
- `GET /api/v1/auth/me` - 获取当前用户信息
- `POST /api/v1/auth/refresh` - 刷新 Token

### Memo 管理
- `GET /api/v1/memos` - 获取 Memo 列表（支持分页、过滤）
- `POST /api/v1/memos` - 创建 Memo
- `GET /api/v1/memos/:id` - 获取单个 Memo
- `PUT /api/v1/memos/:id` - 更新 Memo
- `DELETE /api/v1/memos/:id` - 删除 Memo

### 标签管理
- `GET /api/v1/tags` - 获取所有标签

### 评论系统
- `GET /api/v1/comments/memo/:memoId` - 获取 Memo 的评论
- `POST /api/v1/comments/memo/:memoId` - 创建评论

### 用户管理
- `GET /api/v1/users/:id/stats` - 获取用户统计
- `GET /api/v1/users` - 获取所有用户（管理员）

### 系统设置
- `GET /api/v1/settings/public` - 获取公开设置
- `GET /api/v1/settings` - 获取所有设置（管理员）
- `PUT /api/v1/settings` - 更新设置（管理员）

## 数据库设计

### 核心表结构
- `users` - 用户表
- `memos` - 备忘录表
- `tags` - 标签表
- `memo_tags` - Memo-标签关联表
- `comments` - 评论表
- `settings` - 系统设置表
- `user_settings` - 用户设置表

## 部署指南

请参考 [DEPLOYMENT.md](./DEPLOYMENT.md) 获取详细的部署指南。

## 快速开始

### 1. 环境准备

确保已安装：
- Node.js 18+
- npm 或 pnpm
- Cloudflare CLI (wrangler)

### 2. 克隆和安装

```bash
git clone https://github.com/your-username/memos-lite.git
cd memos-lite
```

### 3. 后端部署

```bash
# 进入 API 目录
cd packages/api

# 安装依赖
npm install

# 配置 wrangler.toml 中的数据库 ID 和环境变量

# 初始化数据库
npm run db:init

# 部署到 Cloudflare Workers
npm run deploy
```

### 4. 前端开发

```bash
# 进入前端目录
cd packages/web

# 安装依赖
npm install

# 配置 API 地址
# 创建 .env 文件，设置 VITE_API_URL=https://your-api-domain.workers.dev

# 开发模式
npm run dev

# 构建前端
npm run build
```

### 5. 自动化部署到 GitHub Pages

项目提供了自动化部署脚本：

```bash
# 回到项目根目录
cd ../..

# 运行部署脚本（会自动构建并部署到 GitHub Pages）
./deploy.sh
```

**注意**：
- 确保 GitHub 仓库已开启 GitHub Pages 功能
- 确保在 main 分支且工作目录干净（无未提交更改）
- 首次部署后需要在 GitHub 仓库设置中配置 Pages 源为 `gh-pages` 分支

## 配置说明

### 后端配置 (wrangler.toml)
- `JWT_SECRET`: JWT 密钥
- `CORS_ORIGIN`: 允许的前端域名
- 数据库绑定配置

### 前端配置 (.env)
- `VITE_API_URL`: 后端 API 地址

## 系统设置

可通过管理员账号配置：
- `site_title`: 站点标题
- `site_description`: 站点描述
- `allow_registration`: 是否允许注册
- `default_visibility`: 默认可见性

## 默认管理员

初始管理员账号：
- 用户名：`admin`
- 密码：`admin123`

**请在首次登录后立即修改密码！**

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
