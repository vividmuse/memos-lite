import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore, useAppStore } from '@/store'
import { settingsApi } from '@/utils/api'

// 页面组件
import Layout from '@/components/Layout'
import LoginPage from '@/pages/LoginPage'
import HomePage from '@/pages/HomePage'
import MemoDetailPage from '@/pages/MemoDetailPage'
import SettingsPage from '@/pages/SettingsPage'
import UserProfilePage from '@/pages/UserProfilePage'
import CalendarPage from '@/pages/CalendarPage'
import TagsPage from '@/pages/TagsPage'

// 保护路由组件
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, checkAuth } = useAuthStore()
  
  useEffect(() => {
    checkAuth()
  }, [checkAuth])
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

// 管理员路由组件
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }
  
  return <>{children}</>
}

function App() {
  const { setSettings, theme } = useAppStore()
  const { checkAuth } = useAuthStore()

  useEffect(() => {
    // 初始化认证状态
    checkAuth()
    
    // 从 localStorage 获取主题并应用
    const savedTheme = localStorage.getItem('app-storage')
    if (savedTheme) {
      try {
        const parsedStorage = JSON.parse(savedTheme)
        const currentTheme = parsedStorage?.state?.theme || 'light'
        if (currentTheme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      } catch (error) {
        console.error('Failed to parse theme from localStorage:', error)
      }
    }
    
    // 应用当前主题
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    
    // 加载公开设置
    const loadSettings = async () => {
      try {
        const settings = await settingsApi.getPublicSettings()
        setSettings(settings)
        
        // 设置页面标题
        if (settings.site_title) {
          document.title = settings.site_title
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }
    
    loadSettings()
  }, [checkAuth, setSettings])

  // 单独监听主题变化
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Routes>
        {/* 公开路由 */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* 保护路由组 - 使用Layout作为父路由 */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          {/* 嵌套路由 */}
          <Route index element={<HomePage />} />
          <Route path="memo/:id" element={<MemoDetailPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="tags" element={<TagsPage />} />
          <Route path="tags/:tagName" element={<TagsPage />} />
          <Route path="profile" element={<UserProfilePage />} />
          
          {/* 管理员路由 */}
          <Route path="settings" element={
            <AdminRoute>
              <SettingsPage />
            </AdminRoute>
          } />
        </Route>
        
        {/* 默认重定向 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App 