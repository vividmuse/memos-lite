#!/bin/bash

# MoeMemos 1.7.2 + Memos 0.24.0 兼容性详细测试
# 默认用户名密码：admin/admin123

API_BASE="https://memos-api.51min.win"
TOKEN=""

echo "🧪 MoeMemos 1.7.2 兼容性详细测试"
echo "=========================================="

# 1. 测试系统状态
echo -e "\n1️⃣ 测试系统状态 /api/v1/status"
STATUS_RESPONSE=$(curl -s "$API_BASE/api/v1/status")
echo "Response: $STATUS_RESPONSE" | jq '.' 2>/dev/null || echo "Response: $STATUS_RESPONSE"

# 2. 测试工作区信息
echo -e "\n2️⃣ 测试工作区信息 /api/v1/workspace/profile"
WORKSPACE_RESPONSE=$(curl -s "$API_BASE/api/v1/workspace/profile")
echo "Response: $WORKSPACE_RESPONSE" | jq '.' 2>/dev/null || echo "Response: $WORKSPACE_RESPONSE"

# 3. 测试用户登录
echo -e "\n3️⃣ 测试用户登录 /api/v1/auth/login"
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')
echo "Response: $LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "Response: $LOGIN_RESPONSE"

# 提取 token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token // .token // empty')
if [ -z "$TOKEN" ]; then
  echo "❌ 登录失败，无法获取 token"
  exit 1
fi
echo "✅ 登录成功，Token: ${TOKEN:0:20}..."

# 4. 测试用户信息 (MoeMemos 格式)
echo -e "\n4️⃣ 测试用户信息 /api/v1/user/me"
USER_ME_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/api/v1/user/me")
echo "Response: $USER_ME_RESPONSE" | jq '.' 2>/dev/null || echo "Response: $USER_ME_RESPONSE"

# 5. 测试用户信息 (标准格式)
echo -e "\n5️⃣ 测试用户信息 /api/v1/users/me"
USERS_ME_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/api/v1/users/me")
echo "Response: $USERS_ME_RESPONSE" | jq '.' 2>/dev/null || echo "Response: $USERS_ME_RESPONSE"

# 6. 测试备忘录列表
echo -e "\n6️⃣ 测试备忘录列表 /api/v1/memos"
MEMOS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/api/v1/memos")
echo "Memos count: $(echo "$MEMOS_RESPONSE" | jq 'length // 0')"
echo "First memo: $(echo "$MEMOS_RESPONSE" | jq '.[0] // "No memos"')"

# 7. 测试备忘录列表 (兼容格式)
echo -e "\n7️⃣ 测试备忘录列表 /api/v1/memo"
MEMO_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/api/v1/memo")
echo "Memo count: $(echo "$MEMO_RESPONSE" | jq 'length // 0')"

# 8. 测试标签列表
echo -e "\n8️⃣ 测试标签列表 /api/v1/tags"
TAGS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/api/v1/tags")
echo "Response: $TAGS_RESPONSE" | jq '.' 2>/dev/null || echo "Response: $TAGS_RESPONSE"

# 9. 测试标签列表 (兼容格式)
echo -e "\n9️⃣ 测试标签列表 /api/v1/tag"
TAG_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/api/v1/tag")
echo "Response: $TAG_RESPONSE" | jq '.' 2>/dev/null || echo "Response: $TAG_RESPONSE"

# 10. 测试资源列表
echo -e "\n🔟 测试资源列表 /api/v1/resources"
RESOURCES_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/api/v1/resources")
echo "Response: $RESOURCES_RESPONSE" | jq '.' 2>/dev/null || echo "Response: $RESOURCES_RESPONSE"

# 11. 创建测试备忘录
echo -e "\n1️⃣1️⃣ 创建测试备忘录"
CREATE_MEMO_RESPONSE=$(curl -s -X POST "$API_BASE/api/v1/memos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"🧪 MoeMemos 兼容性测试备忘录 #test","visibility":"PRIVATE"}')
echo "Response: $CREATE_MEMO_RESPONSE" | jq '.' 2>/dev/null || echo "Response: $CREATE_MEMO_RESPONSE"

echo -e "\n✨ 测试完成！"
echo "请检查以上响应是否符合 MoeMemos 1.7.2 的预期格式" 