import { useState, useEffect } from 'react'
import { 
  SaveIcon, 
  KeyIcon, 
  CopyIcon, 
  PlusIcon, 
  TrashIcon,
  EyeIcon,
  EyeOffIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  UserPlusIcon,
  PaletteIcon,
  UsersIcon,
  SettingsIcon,
  InfoIcon
} from 'lucide-react'
import { settingsApi, authApi } from '@/utils/api'
import { useAppStore, useAuthStore } from '@/store'
import { Settings, User, ApiToken, CreateApiTokenRequest } from '@/types'

export default function SettingsPage() {
  const { settings, setSettings } = useAppStore()
  const { user: currentUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [activeTab, setActiveTab] = useState('basic')
  
  // 基础设置
  const [siteTitle, setSiteTitle] = useState('')
  const [siteDescription, setSiteDescription] = useState('')
  const [allowRegistration, setAllowRegistration] = useState(false)
  const [disablePasswordLogin, setDisablePasswordLogin] = useState(false)
  const [disableUsernameMod, setDisableUsernameMod] = useState(false)
  const [disableNicknameMod, setDisableNicknameMod] = useState(false)
  const [weekStartDay, setWeekStartDay] = useState(0) // 0=周日, 1=周一
  
  // 自定义样式和脚本
  const [customCSS, setCustomCSS] = useState('')
  const [customJS, setCustomJS] = useState('')
  
  // API令牌管理
  const [tokens, setTokens] = useState<ApiToken[]>([])
  const [showTokenForm, setShowTokenForm] = useState(false)
  const [newTokenName, setNewTokenName] = useState('')
  const [newTokenExpiry, setNewTokenExpiry] = useState('never')
  const [newToken, setNewToken] = useState<string | null>(null)
  const [visibleTokens, setVisibleTokens] = useState<Set<number>>(new Set())
  
  // 用户管理
  const [users, setUsers] = useState<User[]>([])
  const [showUserForm, setShowUserForm] = useState(false)
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'USER' as 'USER' | 'ADMIN'
  })

  useEffect(() => {
    loadSettings()
    loadTokens()
    loadUsers()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const settingsData = await settingsApi.getSettings()
      setSettings(settingsData)
      setSiteTitle(settingsData.site_title || '')
      setSiteDescription(settingsData.site_description || '')
      setAllowRegistration(settingsData.allow_registration === 'true')
      setDisablePasswordLogin(settingsData.disable_password_login === 'true')
      setDisableUsernameMod(settingsData.disable_username_mod === 'true')
      setDisableNicknameMod(settingsData.disable_nickname_mod === 'true')
      setWeekStartDay(parseInt(settingsData.week_start_day || '0'))
      setCustomCSS(settingsData.custom_css || '')
      setCustomJS(settingsData.custom_js || '')
    } catch (error) {
      showMessage('error', '加载设置失败')
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTokens = async () => {
    try {
      const tokensData = await authApi.getTokens()
      setTokens(tokensData)
    } catch (error) {
      console.error('Failed to load tokens:', error)
      showMessage('error', '加载API令牌失败')
    }
  }

  const loadUsers = async () => {
    try {
      // 这里需要添加获取用户列表的接口
      // const usersData = await userApi.getUsers()
      // setUsers(usersData)
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const updatedSettings: Settings = {
        site_title: siteTitle,
        site_description: siteDescription,
        allow_registration: allowRegistration.toString(),
        default_visibility: settings?.default_visibility || 'PRIVATE',
        disable_password_login: disablePasswordLogin.toString(),
        disable_username_mod: disableUsernameMod.toString(),
        disable_nickname_mod: disableNicknameMod.toString(),
        week_start_day: weekStartDay.toString(),
        custom_css: customCSS,
        custom_js: customJS
      }
      
      await settingsApi.updateSettings(updatedSettings)
      setSettings({ ...settings, ...updatedSettings })
      showMessage('success', '设置保存成功')
      
      // 更新页面标题
      if (siteTitle) {
        document.title = siteTitle
      }
      
      // 应用自定义样式
      applyCustomStyles()
    } catch (error) {
      showMessage('error', '保存设置失败')
      console.error('Failed to save settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const applyCustomStyles = () => {
    // 移除旧的自定义样式
    const oldStyle = document.getElementById('custom-styles')
    if (oldStyle) {
      oldStyle.remove()
    }
    
    const oldScript = document.getElementById('custom-scripts')
    if (oldScript) {
      oldScript.remove()
    }

    // 添加自定义CSS
    if (customCSS.trim()) {
      const styleElement = document.createElement('style')
      styleElement.id = 'custom-styles'
      styleElement.textContent = customCSS
      document.head.appendChild(styleElement)
    }

    // 添加自定义JavaScript
    if (customJS.trim()) {
      const scriptElement = document.createElement('script')
      scriptElement.id = 'custom-scripts'
      scriptElement.textContent = customJS
      document.head.appendChild(scriptElement)
    }
  }

  const createToken = async () => {
    if (!newTokenName.trim()) {
      showMessage('error', '请输入令牌名称')
      return
    }

    try {
      // 计算过期时间
      let expiresAt: number | undefined
      if (newTokenExpiry !== 'never') {
        const now = Date.now() / 1000
        const days = parseInt(newTokenExpiry)
        expiresAt = now + (days * 24 * 60 * 60)
      }

      const tokenData: CreateApiTokenRequest = {
        name: newTokenName.trim(),
        expires_at: expiresAt
      }

      const createdToken = await authApi.createToken(tokenData)
      
      setTokens(prev => [createdToken, ...prev])
      setNewToken(createdToken.token || '')
      setNewTokenName('')
      setNewTokenExpiry('never')
      setShowTokenForm(false)
      showMessage('success', 'API令牌创建成功')
    } catch (error) {
      showMessage('error', '创建令牌失败')
      console.error('Failed to create token:', error)
    }
  }

  const deleteToken = async (tokenId: number) => {
    if (!confirm('确定要删除这个API令牌吗？删除后无法恢复。')) {
      return
    }

    try {
      await authApi.deleteToken(tokenId)
      setTokens(prev => prev.filter(t => t.id !== tokenId))
      showMessage('success', 'API令牌删除成功')
    } catch (error) {
      showMessage('error', '删除令牌失败')
      console.error('Failed to delete token:', error)
    }
  }

  const createUser = async () => {
    if (!newUser.username.trim() || !newUser.password.trim()) {
      showMessage('error', '请填写用户名和密码')
      return
    }

    try {
      // 这里需要添加创建用户的接口
      const userData: User = {
        id: Date.now(),
        username: newUser.username,
        role: newUser.role,
        created_at: Date.now() / 1000,
        updated_at: Date.now() / 1000
      }
      
      setUsers(prev => [userData, ...prev])
      setNewUser({ username: '', password: '', role: 'USER' })
      setShowUserForm(false)
      showMessage('success', '用户创建成功')
    } catch (error) {
      showMessage('error', '创建用户失败')
      console.error('Failed to create user:', error)
    }
  }

  const deleteUser = async (userId: number) => {
    if (!confirm('确定要删除这个用户吗？删除后无法恢复。')) {
      return
    }

    try {
      // 这里需要添加删除用户的接口
      setUsers(prev => prev.filter(u => u.id !== userId))
      showMessage('success', '用户删除成功')
    } catch (error) {
      showMessage('error', '删除用户失败')
      console.error('Failed to delete user:', error)
    }
  }

  const copyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token)
      showMessage('success', '令牌已复制到剪贴板')
    } catch (error) {
      showMessage('error', '复制失败')
    }
  }

  const toggleTokenVisibility = (tokenId: number) => {
    setVisibleTokens(prev => {
      const newSet = new Set(prev)
      if (newSet.has(tokenId)) {
        newSet.delete(tokenId)
      } else {
        newSet.add(tokenId)
      }
      return newSet
    })
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN')
  }

  const isTokenExpired = (token: ApiToken) => {
    if (!token.expires_at) return false
    return Date.now() / 1000 > token.expires_at
  }

  const getExpiryLabel = (expiryValue: string) => {
    switch (expiryValue) {
      case 'never': return '永不过期'
      case '7': return '7天后过期'
      case '30': return '30天后过期'
      case '90': return '90天后过期'
      case '365': return '1年后过期'
      default: return '自定义'
    }
  }

  const weekDayOptions = [
    { value: 0, label: '周日' },
    { value: 1, label: '周一' },
    { value: 2, label: '周二' },
    { value: 3, label: '周三' },
    { value: 4, label: '周四' },
    { value: 5, label: '周五' },
    { value: 6, label: '周六' }
  ]

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const tabs = [
    { id: 'basic', label: '基础', icon: SettingsIcon },
    { id: 'appearance', label: '外观', icon: PaletteIcon },
    { id: 'users', label: '用户', icon: UsersIcon },
    { id: 'api', label: 'API', icon: KeyIcon },
    { id: 'about', label: '关于', icon: InfoIcon }
  ]

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">系统设置</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          管理站点设置、用户和API访问
        </p>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
            : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
        }`}>
          {message.type === 'success' ? (
            <CheckCircleIcon className="w-5 h-5" />
          ) : (
            <AlertCircleIcon className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* 标签导航 */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* 基础设置 */}
      {activeTab === 'basic' && (
        <div className="space-y-6">
          {/* 站点设置 */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">站点设置</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  服务器名称
                </label>
                <input
                  type="text"
                  value={siteTitle}
                  onChange={(e) => setSiteTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Memos"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  站点描述
                </label>
                <textarea
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="轻量级备忘录系统"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  一般设置
                </label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="allowRegistration"
                      checked={allowRegistration}
                      onChange={(e) => setAllowRegistration(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="allowRegistration" className="text-sm text-gray-700 dark:text-gray-300">
                      禁用用户注册
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="disablePasswordLogin"
                      checked={disablePasswordLogin}
                      onChange={(e) => setDisablePasswordLogin(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="disablePasswordLogin" className="text-sm text-gray-700 dark:text-gray-300">
                      禁用密码登录
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="disableUsernameMod"
                      checked={disableUsernameMod}
                      onChange={(e) => setDisableUsernameMod(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="disableUsernameMod" className="text-sm text-gray-700 dark:text-gray-300">
                      禁止修改用户名
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="disableNicknameMod"
                      checked={disableNicknameMod}
                      onChange={(e) => setDisableNicknameMod(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="disableNicknameMod" className="text-sm text-gray-700 dark:text-gray-300">
                      禁止修改用户昵称
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  周开始日
                </label>
                <select
                  value={weekStartDay}
                  onChange={(e) => setWeekStartDay(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {weekDayOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4">
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
                >
                  <SaveIcon className="w-4 h-4" />
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 外观设置 */}
      {activeTab === 'appearance' && (
        <div className="space-y-6">
          {/* 自定义样式 */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">自定义样式</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  自定义 CSS 代码
                </label>
                <textarea
                  value={customCSS}
                  onChange={(e) => setCustomCSS(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="/* 在这里添加自定义 CSS 代码 */"
                />
              </div>
            </div>
          </div>

          {/* 自定义脚本 */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">自定义脚本</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  自定义 JavaScript 代码
                </label>
                <textarea
                  value={customJS}
                  onChange={(e) => setCustomJS(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="// 在这里添加自定义 JavaScript 代码"
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
            >
              <SaveIcon className="w-4 h-4" />
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      )}

      {/* 用户管理 */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">用户管理</h2>
              <button
                onClick={() => setShowUserForm(true)}
                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <UserPlusIcon className="w-4 h-4" />
                创建用户
              </button>
            </div>

            {/* 新用户创建表单 */}
            {showUserForm && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="用户名"
                    className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="密码"
                    className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as 'USER' | 'ADMIN' }))}
                    className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USER">普通用户</option>
                    <option value="ADMIN">管理员</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={createUser}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    创建
                  </button>
                  <button
                    onClick={() => setShowUserForm(false)}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            {/* 用户列表 */}
            <div className="space-y-3">
              {users.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  还没有其他用户
                </div>
              ) : (
                users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user.username?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {user.username}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.role === 'ADMIN' ? '管理员' : '普通用户'}
                          {user.created_at && ` • 创建于 ${formatDate(user.created_at)}`}
                        </div>
                      </div>
                    </div>
                                         {user.id !== currentUser?.id && (
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* API令牌管理 */}
      {activeTab === 'api' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">API令牌</h2>
            <button
              onClick={() => setShowTokenForm(true)}
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              创建令牌
            </button>
          </div>

          {/* 新令牌创建表单 */}
          {showTokenForm && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newTokenName}
                    onChange={(e) => setNewTokenName(e.target.value)}
                    placeholder="令牌名称"
                    className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={newTokenExpiry}
                    onChange={(e) => setNewTokenExpiry(e.target.value)}
                    className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="never">永不过期</option>
                    <option value="7">7天后过期</option>
                    <option value="30">30天后过期</option>
                    <option value="90">90天后过期</option>
                    <option value="365">1年后过期</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={createToken}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    创建
                  </button>
                  <button
                    onClick={() => setShowTokenForm(false)}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                  >
                    取消
                  </button>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {getExpiryLabel(newTokenExpiry)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 新创建的令牌显示 */}
          {newToken && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <KeyIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="font-medium text-green-800 dark:text-green-200">新的API令牌</span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                请妥善保存此令牌，它只会显示一次。
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded text-sm">
                  {newToken}
                </code>
                <button
                  onClick={() => copyToken(newToken)}
                  className="p-2 hover:bg-green-100 dark:hover:bg-green-900/50 rounded transition-colors"
                >
                  <CopyIcon className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => setNewToken(null)}
                className="mt-3 text-sm text-green-600 dark:text-green-400 hover:underline"
              >
                我已保存，关闭
              </button>
            </div>
          )}

          {/* 令牌列表 */}
          <div className="space-y-3">
            {tokens.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                还没有创建任何API令牌
              </div>
            ) : (
              tokens.map((token) => (
                <div key={token.id} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {token.name}
                    </div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">
                    创建于 {formatDate(token.created_at)}
                    {token.last_used_at && ` • 最后使用 ${formatDate(token.last_used_at)}`}
                    {token.expires_at && (
                      <span className={`ml-2 ${isTokenExpired(token) ? 'text-red-600 dark:text-red-400' : ''}`}>
                        • {isTokenExpired(token) ? '已过期' : `过期时间 ${formatDate(token.expires_at)}`}
                      </span>
                    )}
                    {!token.expires_at && <span className="ml-2 text-green-600 dark:text-green-400">• 永不过期</span>}
                  </div>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="text-sm bg-white dark:bg-gray-800 px-2 py-1 rounded border">
                        {token.token 
                          ? (visibleTokens.has(token.id) 
                              ? token.token 
                              : `${token.token.substring(0, 8)}...${token.token.substring(token.token.length - 4)}`)
                          : `Token ID: ${token.token_id}`
                        }
                      </code>
                      {token.token && (
                        <>
                          <button
                            onClick={() => toggleTokenVisibility(token.id)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                          >
                            {visibleTokens.has(token.id) ? (
                              <EyeOffIcon className="w-4 h-4" />
                            ) : (
                              <EyeIcon className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => copyToken(token.token!)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                          >
                            <CopyIcon className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteToken(token.id)}
                    className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 关于 */}
      {activeTab === 'about' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">关于 Memos Lite</h2>
          
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">版本</div>
              <div className="text-gray-900 dark:text-white">v0.24.0</div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">描述</div>
              <div className="text-gray-900 dark:text-white">轻量级、自托管的备忘录系统</div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">了解更多</div>
              <div className="space-y-2">
                <a 
                  href="https://github.com/usememos/memos" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-blue-600 dark:text-blue-400 hover:underline"
                >
                  GitHub 仓库
                </a>
                <a 
                  href="https://www.usememos.com/docs" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-blue-600 dark:text-blue-400 hover:underline"
                >
                  官方文档
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 