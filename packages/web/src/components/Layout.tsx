import { ReactNode } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { 
  HomeIcon, 
  UserIcon, 
  SettingsIcon, 
  LogOutIcon,
  SunIcon,
  MoonIcon,
  MenuIcon,
  XIcon,
  CalendarIcon,
  TagIcon
} from 'lucide-react'
import { useAuthStore, useAppStore } from '@/store'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuthStore()
  const { theme, setTheme, sidebarOpen, toggleSidebar } = useAppStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  const isActivePath = (path: string) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* 简化的顶部导航栏 */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between">
            {/* 左侧 Logo 和导航 */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  Memos
                </span>
              </Link>

              {/* 桌面端导航链接 */}
              <nav className="hidden md:flex items-center gap-1">
                <Link
                  to="/"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActivePath('/')
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <HomeIcon className="w-4 h-4" />
                  <span>首页</span>
                </Link>

                <Link
                  to="/calendar"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActivePath('/calendar')
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <CalendarIcon className="w-4 h-4" />
                  <span>日历</span>
                </Link>

                <Link
                  to="/tags"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActivePath('/tags')
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <TagIcon className="w-4 h-4" />
                  <span>标签</span>
                </Link>
              </nav>
            </div>

            {/* 右侧操作区 */}
            <div className="flex items-center gap-2">
              {/* 主题切换 */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={theme === 'light' ? '切换到暗色模式' : '切换到亮色模式'}
              >
                {theme === 'light' ? (
                  <MoonIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                ) : (
                  <SunIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                )}
              </button>

              {/* 用户菜单 - 桌面端 */}
              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium">{user?.username}</span>
                </div>

                {/* 设置和登出 */}
                <div className="flex items-center gap-1">
                  <Link
                    to="/profile"
                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="个人资料"
                  >
                    <UserIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </Link>

                  {user?.role === 'ADMIN' && (
                    <Link
                      to="/settings"
                      className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      title="系统设置"
                    >
                      <SettingsIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="退出登录"
                  >
                    <LogOutIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {/* 移动端菜单按钮 */}
              <button
                onClick={toggleSidebar}
                className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <MenuIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 移动端侧边栏 */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/20 dark:bg-black/40" onClick={toggleSidebar} />
          <div className="fixed right-0 top-0 h-full w-72 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-xl">
            <div className="flex flex-col h-full">
              {/* 头部 */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold text-sm">M</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    Memos
                  </span>
                </div>
                <button
                  onClick={toggleSidebar}
                  className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              {/* 导航链接 */}
              <nav className="flex-1 p-4 space-y-1">
                <Link
                  to="/"
                  onClick={toggleSidebar}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActivePath('/')
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <HomeIcon className="w-5 h-5" />
                  <span>首页</span>
                </Link>

                <Link
                  to="/calendar"
                  onClick={toggleSidebar}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActivePath('/calendar')
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <CalendarIcon className="w-5 h-5" />
                  <span>日历</span>
                </Link>

                <Link
                  to="/tags"
                  onClick={toggleSidebar}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActivePath('/tags')
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <TagIcon className="w-5 h-5" />
                  <span>标签</span>
                </Link>

                <Link
                  to="/profile"
                  onClick={toggleSidebar}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActivePath('/profile')
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <UserIcon className="w-5 h-5" />
                  <span>个人资料</span>
                </Link>

                {user?.role === 'ADMIN' && (
                  <Link
                    to="/settings"
                    onClick={toggleSidebar}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActivePath('/settings')
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <SettingsIcon className="w-5 h-5" />
                    <span>系统设置</span>
                  </Link>
                )}
              </nav>

              {/* 底部用户信息 */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.username}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.role === 'ADMIN' ? '管理员' : '用户'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    handleLogout()
                    toggleSidebar()
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                >
                  <LogOutIcon className="w-4 h-4" />
                  <span>退出登录</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 主要内容区域 */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  )
} 