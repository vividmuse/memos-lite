import { useState, useEffect, useCallback, useMemo } from 'react'
import { SearchIcon, TagIcon, CalendarIcon, LayoutIcon, GridIcon } from 'lucide-react'
import { memoApi, tagApi } from '@/utils/api'
import { useMemoStore, useTagStore } from '@/store'
import { Memo, Tag } from '@/types'
import MemoCard from '@/components/MemoCard'
import MemoEditor from '@/components/MemoEditor'
import CalendarView from '@/components/CalendarView'
import StatsPanel from '@/components/StatsPanel'

export default function HomePage() {
  const [showEditor, setShowEditor] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedVisibility, setSelectedVisibility] = useState<'ALL' | 'PUBLIC' | 'PRIVATE'>('ALL')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'stats'>('list')

  const { 
    memos, 
    loading: memosLoading, 
    setMemos, 
    setLoading: setMemosLoading,
    addMemo 
  } = useMemoStore()
  
  const { 
    tags, 
    setTags, 
    setLoading: setTagsLoading 
  } = useTagStore()

  // 使用 useCallback 避免无限循环
  const loadMemos = useCallback(async () => {
    setMemosLoading(true)
    try {
      const params = {
        visibility: selectedVisibility === 'ALL' ? undefined : selectedVisibility,
        tag: selectedTag || undefined,
        search: searchTerm || undefined,
        limit: 50
      }
      
      const result = await memoApi.getMemos(params)
      // 处理不同的 API 响应格式
      let memosData: any[] = []
      if (Array.isArray(result)) {
        memosData = result
      } else if (result && typeof result === 'object') {
        // 处理分页响应格式
        if ('data' in result) {
          memosData = (result as any).data || []
        } else if ('items' in result) {
          memosData = (result as any).items || []
        } else {
          // 如果结果本身就是数据对象，尝试提取
          memosData = []
        }
      }
      setMemos(memosData)
    } catch (error) {
      console.error('Failed to load memos:', error)
    } finally {
      setMemosLoading(false)
    }
  }, [selectedVisibility, selectedTag, searchTerm, setMemos, setMemosLoading])

  const loadTags = useCallback(async () => {
    setTagsLoading(true)
    try {
      const tagsData = await tagApi.getTags()
      setTags(tagsData)
    } catch (error) {
      console.error('Failed to load tags:', error)
    } finally {
      setTagsLoading(false)
    }
  }, [setTags, setTagsLoading])

  // 首次加载
  useEffect(() => {
    loadMemos()
    loadTags()
  }, [loadMemos, loadTags])

  const handleMemoCreated = (memo: Memo) => {
    addMemo(memo)
    setShowEditor(false)
    // 重新加载标签，因为可能有新标签
    loadTags()
    // 强制重新加载备忘录列表以确保同步
    setTimeout(() => {
      loadMemos()
    }, 100)
  }

  // 过滤后的备忘录统计
  const memoStats = useMemo(() => {
    const total = memos.length
    const publicCount = memos.filter((m: Memo) => m.visibility === 'PUBLIC').length
    const privateCount = memos.filter((m: Memo) => m.visibility === 'PRIVATE').length
    const todayCount = memos.filter((m: Memo) => {
      const today = new Date().toDateString()
      const memoDate = new Date(m.created_at * 1000).toDateString()
      return today === memoDate
    }).length

    return { total, publicCount, privateCount, todayCount }
  }, [memos])

  const renderContent = () => {
    switch (viewMode) {
      case 'calendar':
        return <CalendarView memos={memos} onDateSelect={(date: Date) => {
          // 可以根据日期过滤备忘录
          console.log('Selected date:', date)
        }} />
      case 'stats':
        return <StatsPanel memos={memos} tags={tags} />
      default:
        return (
          <div className="space-y-4">
            {memos.map((memo: Memo) => (
              <MemoCard key={memo.id} memo={memo} />
            ))}
          </div>
        )
    }
  }

  return (
    <div className="h-full flex">
      {/* 左侧过滤面板 */}
      <div className="w-80 bg-card border-r border-border p-4 overflow-y-auto">
        <div className="space-y-6">
          {/* 统计信息 */}
          <div className="bg-background/50 rounded-lg p-3">
            <h3 className="text-sm font-medium text-foreground mb-2">统计</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>总计: {memoStats.total}</div>
              <div>今日: {memoStats.todayCount}</div>
              <div>公开: {memoStats.publicCount}</div>
              <div>私有: {memoStats.privateCount}</div>
            </div>
          </div>

          {/* 视图模式切换 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              视图模式
            </label>
            <div className="flex space-x-1 bg-background/50 rounded-lg p-1">
              {[
                { value: 'list', label: '列表', icon: LayoutIcon },
                { value: 'calendar', label: '日历', icon: CalendarIcon },
                { value: 'stats', label: '统计', icon: GridIcon }
              ].map((mode) => {
                const Icon = mode.icon
                return (
                  <button
                    key={mode.value}
                    onClick={() => setViewMode(mode.value as any)}
                    className={`flex-1 flex items-center justify-center px-2 py-1 rounded text-xs transition-colors ${
                      viewMode === mode.value 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-accent'
                    }`}
                  >
                    <Icon className="w-3 h-3 mr-1" />
                    {mode.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 搜索 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              搜索
            </label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索备忘录..."
                className="w-full pl-10 pr-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* 可见性过滤 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              可见性
            </label>
            <div className="space-y-2">
              {[
                { value: 'ALL', label: '全部' },
                { value: 'PUBLIC', label: '公开' },
                { value: 'PRIVATE', label: '私有' }
              ].map((option) => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    name="visibility"
                    value={option.value}
                    checked={selectedVisibility === option.value}
                    onChange={(e) => setSelectedVisibility(e.target.value as any)}
                    className="mr-2"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 标签过滤 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              标签
            </label>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              <button
                onClick={() => setSelectedTag(null)}
                className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                  selectedTag === null 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent'
                }`}
              >
                全部标签
              </button>
              {tags.map((tag: Tag) => (
                <button
                  key={tag.id}
                  onClick={() => setSelectedTag(tag.name)}
                  className={`w-full text-left px-2 py-1 rounded text-sm transition-colors flex items-center justify-between ${
                    selectedTag === tag.name 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-accent'
                  }`}
                >
                  <span className="flex items-center">
                    <TagIcon className="w-3 h-3 mr-1" />
                    {tag.name}
                  </span>
                  {tag.memo_count && (
                    <span className="text-xs opacity-70">{tag.memo_count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 右侧内容区 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部操作栏 */}
        <div className="p-4 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              我的备忘录 ({memos.length})
            </h2>
            <button
              onClick={() => setShowEditor(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              写备忘录
            </button>
          </div>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-4">
          {memosLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">加载中...</div>
            </div>
          ) : memos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <p>暂无备忘录</p>
              <button
                onClick={() => setShowEditor(true)}
                className="mt-2 text-primary hover:underline"
              >
                创建第一个备忘录
              </button>
            </div>
          ) : (
            renderContent()
          )}
        </div>
      </div>

      {/* 备忘录编辑器弹窗 */}
      {showEditor && (
        <MemoEditor
          onClose={() => setShowEditor(false)}
          onSave={handleMemoCreated}
        />
      )}
    </div>
  )
} 