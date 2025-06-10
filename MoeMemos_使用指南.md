# MoeMemos iOS 客户端使用指南

## 🚀 memos-lite 与 MoeMemos 1.7.2 完全兼容

我们的 memos-lite 项目已经完全兼容 MoeMemos iOS 客户端 v1.7.2，支持 Memos 0.24.0 API 格式。

## 📱 MoeMemos 客户端下载

- **App Store**: [Moe Memos](https://apps.apple.com/app/moe-memos/id1611863469)
- **GitHub**: [MoeMemos Release](https://github.com/mudkipme/MoeMemos/releases/latest)

## 🔗 服务器配置

### 服务器地址
```
https://memos-api.51min.win
```

### 登录信息
- **用户名**: `admin`
- **密码**: `admin123`

⚠️ **重要提醒**: 生产环境中请务必修改默认密码！

## 📋 配置步骤

### 1. 下载并安装 MoeMemos
从 App Store 下载 Moe Memos 应用

### 2. 添加服务器
1. 打开 MoeMemos 应用
2. 点击 "+" 添加新的服务器
3. 输入服务器地址：`https://memos-api.51min.win`
4. 输入用户名：`admin`
5. 输入密码：`admin123`
6. 点击连接

### 3. 开始使用
登录成功后，您可以：
- ✅ 创建新的备忘录
- ✅ 查看现有备忘录
- ✅ 使用标签组织备忘录
- ✅ 搜索备忘录内容
- ✅ 上传图片和附件
- ✅ 归档备忘录

## 🔧 技术特性

### 兼容的 API 端点
- `GET /api/v1/status` - 系统状态
- `GET /api/v1/workspace/profile` - 工作区信息
- `POST /api/v1/auth/login` - 用户登录
- `GET /api/v1/user/me` - 用户信息
- `GET /api/v1/memos` - 备忘录列表
- `POST /api/v1/memos` - 创建备忘录
- `PUT /api/v1/memos/:id` - 更新备忘录
- `DELETE /api/v1/memos/:id` - 删除备忘录
- `GET /api/v1/tags` - 标签列表
- `GET /api/v1/resources` - 资源文件列表
- `POST /api/v1/resources` - 上传文件

### 支持的功能
- **身份验证**: JWT Bearer Token
- **备忘录管理**: 完整的 CRUD 操作
- **标签系统**: 多标签支持和筛选
- **搜索功能**: 全文搜索
- **文件上传**: 图片、文档等文件类型
- **归档功能**: 备忘录归档和取消归档
- **可见性控制**: PUBLIC/PRIVATE 可见性设置

### 数据格式兼容性
我们的 API 返回的数据格式完全符合 Memos 0.24.0 标准：

**用户信息格式**:
```json
{
  "id": 1,
  "name": "admin",
  "username": "admin",
  "email": "",
  "nickname": "admin",
  "role": "ADMIN",
  "avatarUrl": "",
  "createdTs": 1749541077,
  "updatedTs": 1749541077,
  "setting": {
    "locale": "zh-CN",
    "appearance": "system",
    "memoVisibility": "PRIVATE"
  }
}
```

**备忘录格式**:
```json
{
  "id": 9,
  "name": "memo-9",
  "uid": "memo-9",
  "creatorId": 1,
  "createdTs": 1749559289,
  "updatedTs": 1749559289,
  "displayTs": 1749559289,
  "content": "🧪 MoeMemos 兼容性测试备忘录 #test",
  "visibility": "PRIVATE",
  "pinned": false,
  "parent": null,
  "resources": [],
  "relations": [],
  "reactions": [],
  "property": {},
  "snippet": "🧪 MoeMemos 兼容性测试备忘录 #test",
  "creator": {
    "id": 1,
    "name": "admin",
    "username": "admin",
    "email": "",
    "nickname": "admin",
    "role": "USER",
    "avatarUrl": ""
  }
}
```

## 🎯 测试验证

我们提供了完整的测试脚本来验证兼容性：

```bash
# 运行兼容性测试
./test_moememos_detailed.sh
```

所有核心功能都已通过测试验证。

## 🔒 安全注意事项

1. **修改默认密码**: 生产环境请立即修改默认的 admin 密码
2. **HTTPS 连接**: 我们的 API 使用 HTTPS 确保数据传输安全
3. **JWT Token**: 使用 JWT 进行身份验证，token 会自动过期
4. **访问控制**: 支持 PUBLIC/PRIVATE 备忘录可见性控制

## 🛠️ 故障排除

### 常见问题

**Q: 无法连接到服务器**
A: 请检查：
- 网络连接是否正常
- 服务器地址是否正确：`https://memos-api.51min.win`
- 是否使用了正确的登录信息

**Q: 登录失败**
A: 请确认：
- 用户名：`admin`
- 密码：`admin123`
- 如果密码已修改，请使用新密码

**Q: 看不到备忘录**
A: 可能的原因：
- 首次使用，还没有创建备忘录
- 备忘录是私有的，需要登录才能查看
- 检查筛选条件和搜索设置

**Q: 无法上传文件**
A: 请检查：
- 文件大小是否超过 32MB 限制
- 网络连接是否稳定
- 文件格式是否支持

## 📞 技术支持

如果遇到问题：
1. 首先尝试重启 MoeMemos 应用
2. 检查服务器状态：访问 https://memos-api.51min.win/api/v1/status
3. 查看应用日志中的错误信息
4. 联系技术支持

## 🎉 功能亮点

- ✅ **完全兼容**: 支持 MoeMemos 1.7.2 + Memos 0.24.0
- ✅ **云端同步**: 数据安全存储在 Cloudflare D1
- ✅ **快速访问**: 基于 Cloudflare Workers 的高性能 API
- ✅ **移动优化**: 专为移动设备优化的用户体验
- ✅ **标签管理**: 强大的标签组织和筛选功能
- ✅ **搜索功能**: 全文搜索快速找到备忘录
- ✅ **文件支持**: 支持图片、文档等多种文件类型
- ✅ **离线查看**: 支持离线查看已缓存的备忘录

---

🚀 **现在就开始使用 MoeMemos 管理您的备忘录吧！** 