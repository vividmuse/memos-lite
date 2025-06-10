import { useState, useEffect } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { 
  HomeIcon, 
  SettingsIcon, 
  TagIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  SearchIcon,
  ArchiveIcon
} from 'lucide-react'
import { useAppStore, useTagStore, useMemoStore } from '@/store'
import { tagApi } from '@/utils/api'

const MONTHS = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export default function Layout() {
  const location = useLocation()
  const { theme, setTheme } = useAppStore()
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light')
  const { tags, setTags } = useTagStore()
  const { memos, searchTerm, setSearchTerm, clearSearchTerm, selectedTags, addSelectedTag, removeSelectedTag, clearSelectedTags } = useMemoStore()
  const [currentDate, setCurrentDate] = useState(new Date())

  // 加载标签
  useEffect(() => {
    const loadTags = async () => {
      try {
        const result = await tagApi.getTags()
        console.log('Tags loaded:', result)
        // 假设 API 返回标签数组
        if (Array.isArray(result)) {
          setTags(result)
        } else {
          setTags([])
        }
      } catch (error) {
        console.error('Failed to load tags:', error)
        setTags([])
      }
    }

    loadTags()
  }, [setTags])

  // 获取当前月份的日历数据
  const calendarData = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const currentDateObj = new Date(startDate)
    
    for (let i = 0; i < 42; i++) {
      const dateKey = `${currentDateObj.getFullYear()}-${String(currentDateObj.getMonth() + 1).padStart(2, '0')}-${String(currentDateObj.getDate()).padStart(2, '0')}`
      const dayMemos = memos.filter(memo => {
        const memoDate = new Date(memo.created_at * 1000)
        const memoDateKey = `${memoDate.getFullYear()}-${String(memoDate.getMonth() + 1).padStart(2, '0')}-${String(memoDate.getDate()).padStart(2, '0')}`
        return memoDateKey === dateKey
      })
      
      days.push({
        date: new Date(currentDateObj),
        isCurrentMonth: currentDateObj.getMonth() === month,
        isToday: currentDateObj.toDateString() === new Date().toDateString(),
        memoCount: dayMemos.length
      })
      
      currentDateObj.setDate(currentDateObj.getDate() + 1)
    }
    
    return days
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const handleTagClick = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      removeSelectedTag(tagName)
    } else {
      addSelectedTag(tagName)
    }
  }

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* 左侧栏 - 极简设计 */}
      <div className="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Logo 区域 */}
        <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">Memos</span>
          </Link>
        </div>

        {/* 搜索框 */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索备忘录"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchTerm && (
              <button
                onClick={clearSearchTerm}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* 选中的标签显示区域 */}
        {selectedTags.length > 0 && (
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">选中的标签</span>
              <button
                onClick={clearSelectedTags}
                className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
              >
                清除全部
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedTags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md"
                >
                  #{tag}
                  <button
                    onClick={() => removeSelectedTag(tag)}
                    className="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 日历 */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {currentDate.getFullYear()}年{MONTHS[currentDate.getMonth()]}
            </h3>
            <div className="flex space-x-1">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <ChevronLeftIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <ChevronRightIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
          
          {/* 星期标题 */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map(day => (
              <div key={day} className="text-xs text-center text-gray-500 dark:text-gray-400 font-medium py-1">
                {day}
              </div>
            ))}
          </div>
          
          {/* 日历网格 */}
          <div className="grid grid-cols-7 gap-1">
            {calendarData().map((day, index) => (
              <button
                key={index}
                className={`
                  relative text-xs text-center py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700
                  ${day.isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}
                  ${day.isToday ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-semibold' : ''}
                `}
              >
                <span>{day.date.getDate()}</span>
                {day.memoCount > 0 && (
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-[10px] text-white font-bold">{day.memoCount}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 标签 */}
        <div className="p-3 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">标签</h3>
            <PlusIcon className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300" />
          </div>
          
          <div className="space-y-1">
            {tags.slice(0, 10).map(tag => (
              <button
                key={tag.id}
                onClick={() => handleTagClick(tag.name)}
                className={`w-full flex items-center justify-between px-2 py-1 text-sm rounded group
                  ${selectedTags.includes(tag.name) 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                <div className="flex items-center space-x-2">
                  <TagIcon className="w-3 h-3 text-gray-400" />
                  <span>#{tag.name}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {tag.memo_count || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 底部导航 */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-4 gap-2">
            <Link
              to="/"
              className={`p-2 rounded-lg flex items-center justify-center ${
                location.pathname === '/' 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <HomeIcon className="w-5 h-5" />
            </Link>
            <Link
              to="/archived"
              className={`p-2 rounded-lg flex items-center justify-center ${
                location.pathname === '/archived' 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <ArchiveIcon className="w-5 h-5" />
            </Link>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>
            <Link
              to="/settings"
              className={`p-2 rounded-lg flex items-center justify-center ${
                location.pathname === '/settings' 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <SettingsIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col">
        <Outlet />
      </div>
    </div>
  )
} 