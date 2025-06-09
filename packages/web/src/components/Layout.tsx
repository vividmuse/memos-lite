import { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  MenuIcon, 
  HomeIcon, 
  UserIcon, 
  SettingsIcon, 
  LogOutIcon,
  SunIcon,
  MoonIcon,
  PlusIcon
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
    <div className="flex h-screen bg-background">
      {/* 侧边栏 */}
      <aside className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed lg:static lg:translate-x-0 z-50 w-64 h-full bg-card border-r border-border transition-transform duration-300 ease-in-out`}>
        <div className="flex flex-col h-full">
          {/* 头部 */}
          <div className="p-4 border-b border-border">
            <h1 className="text-xl font-bold text-foreground">Memos Lite</h1>
            <p className="text-sm text-muted-foreground">@{user?.username}</p>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 p-4 space-y-2">
            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
            >
              <HomeIcon className="w-5 h-5" />
              <span>首页</span>
            </Link>

            <Link
              to="/profile"
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
            >
              <UserIcon className="w-5 h-5" />
              <span>个人资料</span>
            </Link>

            {user?.role === 'ADMIN' && (
              <Link
                to="/settings"
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
              >
                <SettingsIcon className="w-5 h-5" />
                <span>系统设置</span>
              </Link>
            )}
          </nav>

          {/* 底部操作 */}
          <div className="p-4 border-t border-border space-y-2">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-md hover:bg-accent transition-colors"
            >
              {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
              <span>{theme === 'light' ? '暗色模式' : '亮色模式'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-md hover:bg-accent text-destructive transition-colors"
            >
              <LogOutIcon className="w-5 h-5" />
              <span>退出登录</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* 顶部栏 */}
        <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between lg:justify-end">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-md hover:bg-accent"
          >
            <MenuIcon className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
              <PlusIcon className="w-4 h-4" />
              <span className="hidden sm:inline">新建 Memo</span>
            </button>
          </div>
        </header>

        {/* 主内容 */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>

      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  )
} 