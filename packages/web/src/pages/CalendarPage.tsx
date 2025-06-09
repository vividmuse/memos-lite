import { useState, useEffect, useMemo } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from 'lucide-react'
import { memoApi } from '@/utils/api'
import { Memo } from '@/types'
import MemoCard from '@/components/MemoCard'

const MONTHS = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月'
]

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [memos, setMemos] = useState<Memo[]>([])
  const [loading, setLoading] = useState(false)
  const [dayMemos, setDayMemos] = useState<Memo[]>([])

  const loadMemos = async () => {
    setLoading(true)
    try {
      const result = await memoApi.getMemos({ limit: 1000 }) // 获取更多数据用于日历显示
      let memosData: Memo[] = []
      if (Array.isArray(result)) {
        memosData = result
      } else if (result && typeof result === 'object') {
        if ('data' in result) {
          memosData = (result as any).data || []
        } else if ('items' in result) {
          memosData = (result as any).items || []
        }
      }
      setMemos(memosData)
    } catch (error) {
      console.error('Failed to load memos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMemos()
  }, [])

  // 按日期分组的备忘录
  const memosByDate = useMemo(() => {
    const grouped: Record<string, Memo[]> = {}
    memos.forEach(memo => {
      const date = new Date(memo.created_at * 1000)
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(memo)
    })
    return grouped
  }, [memos])

  // 获取当前月份的日历数据
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const currentDateObj = new Date(startDate)
    
    for (let i = 0; i < 42; i++) { // 6 周 × 7 天
      const dateKey = `${currentDateObj.getFullYear()}-${String(currentDateObj.getMonth() + 1).padStart(2, '0')}-${String(currentDateObj.getDate()).padStart(2, '0')}`
      const dayMemos = memosByDate[dateKey] || []
      
      days.push({
        date: new Date(currentDateObj),
        isCurrentMonth: currentDateObj.getMonth() === month,
        isToday: currentDateObj.toDateString() === new Date().toDateString(),
        isSelected: selectedDate && currentDateObj.toDateString() === selectedDate.toDateString(),
        memoCount: dayMemos.length,
        memos: dayMemos
      })
      
      currentDateObj.setDate(currentDateObj.getDate() + 1)
    }
    
    return days
  }, [currentDate, memosByDate, selectedDate])

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

  const handleDateClick = (date: Date, memos: Memo[]) => {
    setSelectedDate(date)
    setDayMemos(memos)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
    const today = new Date()
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    setDayMemos(memosByDate[todayKey] || [])
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">日历</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            按日期查看备忘录
          </p>
        </div>
        
        <button
          onClick={goToToday}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <CalendarIcon className="w-4 h-4" />
          今天
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 日历视图 */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            {/* 月份导航 */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentDate.getFullYear()}年 {MONTHS[currentDate.getMonth()]}
              </h2>
              
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>

            {/* 星期标题 */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS.map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                  {day}
                </div>
              ))}
            </div>

            {/* 日历网格 */}
            <div className="grid grid-cols-7 gap-1">
              {calendarData.map((day, index) => (
                <button
                  key={index}
                  onClick={() => handleDateClick(day.date, day.memos)}
                  className={`
                    p-2 h-16 border border-transparent rounded-lg transition-all duration-200 relative
                    ${day.isCurrentMonth 
                      ? 'hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20' 
                      : 'text-gray-400 dark:text-gray-600'
                    }
                    ${day.isToday 
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600' 
                      : ''
                    }
                    ${day.isSelected 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : ''
                    }
                  `}
                >
                  <div className="text-sm font-medium">
                    {day.date.getDate()}
                  </div>
                  {day.memoCount > 0 && (
                    <div className={`
                      absolute bottom-1 right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center
                      ${day.isSelected 
                        ? 'bg-white text-blue-600' 
                        : 'bg-blue-600 text-white'
                      }
                    `}>
                      {day.memoCount}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 选中日期的备忘录 */}
        <div className="space-y-4">
          {selectedDate ? (
            <>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {selectedDate.toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {dayMemos.length} 条备忘录
                </p>
              </div>

              <div className="space-y-4">
                {dayMemos.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    这一天还没有备忘录
                  </div>
                ) : (
                  dayMemos.map(memo => (
                    <MemoCard key={memo.id} memo={memo} />
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
              <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <p className="text-gray-500 dark:text-gray-400">
                点击日期查看备忘录
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 