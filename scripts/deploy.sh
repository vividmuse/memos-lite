#!/bin/bash

# Memos Lite 部署脚本

set -e

echo "🚀 开始部署 Memos Lite..."

# 检查必要工具
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm 未安装，请先安装 pnpm"
    exit 1
fi

if ! command -v wrangler &> /dev/null; then
    echo "❌ wrangler 未安装，请先安装 Cloudflare CLI"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
pnpm install

# 部署后端
echo "🔧 部署后端 API..."
cd packages/api

# 初始化数据库（如果需要）
read -p "是否需要初始化数据库？(y/N): " init_db
if [[ $init_db == "y" || $init_db == "Y" ]]; then
    echo "🗄️ 初始化数据库..."
    pnpm db:init
fi

# 部署 Worker
echo "🚀 部署 Cloudflare Worker..."
pnpm deploy

cd ../..

echo "✅ 后端部署完成！"

# 询问是否部署前端
read -p "是否部署前端？(y/N): " deploy_frontend
if [[ $deploy_frontend == "y" || $deploy_frontend == "Y" ]]; then
    echo "🎨 部署前端..."
    cd packages/web
    
    # 构建前端
    pnpm build
    
    echo "📁 前端构建完成，请手动部署 dist 目录到静态托管服务"
    echo "推荐使用 Cloudflare Pages、Vercel 或 Netlify"
    
    cd ../..
fi

echo "🎉 部署完成！"
echo ""
echo "📋 后续步骤："
echo "1. 配置前端环境变量 (VITE_API_BASE_URL)"
echo "2. 更改默认管理员密码"
echo "3. 配置系统设置" 