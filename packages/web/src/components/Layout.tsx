import { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  HomeIcon, 
  UserIcon, 
  SettingsIcon, 
  LogOutIcon,
  SunIcon,
  MoonIcon,
  MenuIcon,
  XIcon
} from 'lucide-react'
import { useAuthStore, useAppStore } from '@/store'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuthStore()
  const { theme, setTheme, sidebarOpen, toggleSidebar } = useAppStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* 左侧 Logo */}
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <MenuIcon className="w-5 h-5" />
              </button>
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <span className="text-xl font-semibold text-gray-900 dark:text-white">
                  Memos
                </span>
              </Link>
            </div>

            {/* 右侧操作区 */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={theme === 'light' ? '切换到暗色模式' : '切换到亮色模式'}
              >
                {theme === 'light' ? (
                  <MoonIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <SunIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>

              <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {user?.username}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="退出登录"
              >
                <LogOutIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 移动端侧边栏 */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={toggleSidebar} />
          <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <span className="text-xl font-semibold text-gray-900 dark:text-white">
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

            <nav className="space-y-2">
              <Link
                to="/"
                onClick={toggleSidebar}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
              >
                <HomeIcon className="w-5 h-5" />
                <span>首页</span>
              </Link>

              <Link
                to="/profile"
                onClick={toggleSidebar}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
              >
                <UserIcon className="w-5 h-5" />
                <span>个人资料</span>
              </Link>

              {user?.role === 'ADMIN' && (
                <Link
                  to="/settings"
                  onClick={toggleSidebar}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  <SettingsIcon className="w-5 h-5" />
                  <span>系统设置</span>
                </Link>
              )}
            </nav>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2 px-3 py-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.username}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.role === 'ADMIN' ? '管理员' : '用户'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 主要内容区域 */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
} 