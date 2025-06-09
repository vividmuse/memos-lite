#!/bin/bash

set -e

echo "🚀 开始部署 Memos Lite..."

# 检查是否在 main 分支
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "❌ 请在 main 分支上进行部署"
    exit 1
fi

# 确保工作目录干净
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ 工作目录有未提交的更改，请先提交"
    exit 1
fi

# 安装依赖
echo "📦 安装前端依赖..."
cd packages/web
npm install

# 构建前端
echo "🔨 构建前端..."
npm run build

# 回到根目录
cd ../..

# 创建 gh-pages 分支或切换到 gh-pages
if git rev-parse --verify gh-pages > /dev/null 2>&1; then
    git checkout gh-pages
    git pull origin gh-pages
else
    git checkout --orphan gh-pages
fi

# 清理旧文件
git rm -rf . > /dev/null 2>&1 || true

# 复制构建文件
cp -r packages/web/dist/* .

# 创建 .nojekyll 文件（GitHub Pages 需要）
touch .nojekyll

# 创建 CNAME 文件（如果有自定义域名）
# echo "your-domain.com" > CNAME

# 提交并推送
git add .
git commit -m "Deploy to GitHub Pages - $(date)"
git push origin gh-pages --force

# 回到 main 分支
git checkout main

echo "✅ 部署完成！"
echo "🌐 GitHub Pages 将在几分钟后更新"
echo "🔗 访问链接: https://$(git config --get remote.origin.url | sed 's/.*github.com[:/]//' | sed 's/\.git$//')" 