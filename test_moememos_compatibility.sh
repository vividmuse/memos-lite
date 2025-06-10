#!/bin/bash

# MoeMemos iOS App 兼容性测试脚本
# 测试所有关键 API 端点

API_BASE="https://memos-api.51min.win"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NDk1NDEyMDUsImV4cCI6MTc1MDE0NjAwNS4wNTQsImp0aSI6IjY1ZDkwNDI2LWI3OGItNGVmOC05MzdkLTI0ZmNmZjVkOGQzOSJ9.wTYD1GrfbfH-CqtEJh2seCin9z-A__T4QU2K0O0EXTI"

echo "🔍 MoeMemos iOS App 兼容性测试"
echo "=================================="
echo

# 1. 系统状态检查
echo "✅ 测试 /api/v1/status"
curl -s "$API_BASE/api/v1/status" | jq -r '.host // "❌ 失败"'
echo

# 2. 工作区配置
echo "✅ 测试 /api/v1/workspace/profile"
curl -s "$API_BASE/api/v1/workspace/profile" | jq -r '.name // "❌ 失败"'
echo

# 3. 用户信息 (MoeMemos 路径)
echo "✅ 测试 /api/v1/user/me"
curl -s "$API_BASE/api/v1/user/me" -H "Authorization: Bearer $TOKEN" | jq -r '.username // "❌ 失败"'
echo

# 4. 用户信息 (标准路径)
echo "✅ 测试 /api/v1/users/me"
curl -s "$API_BASE/api/v1/users/me" -H "Authorization: Bearer $TOKEN" | jq -r '.username // "❌ 失败"'
echo

# 5. 标签列表 (MoeMemos 路径)
echo "✅ 测试 /api/v1/tag"
TAG_RESULT=$(curl -s "$API_BASE/api/v1/tag" -H "Authorization: Bearer $TOKEN" | jq -r '.success // "❌ 失败"')
echo "标签端点: $TAG_RESULT"
echo

# 6. 备忘录列表 (MoeMemos 路径)
echo "✅ 测试 /api/v1/memo"
MEMO_COUNT=$(curl -s "$API_BASE/api/v1/memo" -H "Authorization: Bearer $TOKEN" | jq 'length // 0')
echo "备忘录数量: $MEMO_COUNT"
echo

# 7. 使用 rowStatus 参数
echo "✅ 测试 /api/v1/memo?rowStatus=NORMAL"
NORMAL_COUNT=$(curl -s "$API_BASE/api/v1/memo?rowStatus=NORMAL" -H "Authorization: Bearer $TOKEN" | jq 'length // 0')
echo "正常状态备忘录数量: $NORMAL_COUNT"
echo

# 8. 资源上传端点
echo "✅ 测试 /api/v1/resources"
RESOURCES_RESULT=$(curl -s "$API_BASE/api/v1/resources" -H "Authorization: Bearer $TOKEN" | jq 'type // "❌ 失败"')
echo "资源端点类型: $RESOURCES_RESULT"
echo

echo "🎉 所有端点测试完成！"
echo "==================================" 