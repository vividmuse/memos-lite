import { useState, useEffect, useCallback, useMemo } from 'react'
import { SearchIcon, TagIcon, FilterIcon, PlusIcon, HashIcon } from 'lucide-react'
import { memoApi, tagApi } from '@/utils/api'
import { useMemoStore, useTagStore } from '@/store'
import { Memo, Tag } from '@/types'
import MemoCard from '@/components/MemoCard'
import MemoEditor from '@/components/MemoEditor'

export default function HomePage() {
  const [showEditor, setShowEditor] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedVisibility, setSelectedVisibility] = useState<'ALL' | 'PUBLIC' | 'PRIVATE'>('ALL')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

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
    const todayCount = memos.filter((m: Memo) => {
      const today = new Date().toDateString()
      const memoDate = new Date(m.created_at * 1000).toDateString()
      return today === memoDate
    }).length

    return { total, todayCount }
  }, [memos])

  const hasActiveFilters = selectedVisibility !== 'ALL' || selectedTag || searchTerm

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">我的备忘录</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            总计 {memoStats.total} 条，今日新增 {memoStats.todayCount} 条
          </p>
        </div>
        
        <button
          onClick={() => setShowEditor(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          新建备忘录
        </button>
      </div>

      {/* 搜索和过滤 */}
      <div className="space-y-4">
        {/* 搜索栏 */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索备忘录内容..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 过滤器 */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
              hasActiveFilters || showFilters
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <FilterIcon className="w-4 h-4" />
            过滤器
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                {[selectedVisibility !== 'ALL', selectedTag, searchTerm].filter(Boolean).length}
              </span>
            )}
          </button>

          {/* 快捷过滤 */}
          {['ALL', 'PUBLIC', 'PRIVATE'].map((visibility) => (
            <button
              key={visibility}
              onClick={() => setSelectedVisibility(visibility as any)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedVisibility === visibility
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {visibility === 'ALL' ? '全部' : visibility === 'PUBLIC' ? '公开' : '私有'}
            </button>
          ))}
        </div>

        {/* 展开的过滤器 */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
            {/* 标签过滤 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                按标签过滤
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                    !selectedTag
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  全部标签
                </button>
                {tags.map((tag: Tag) => (
                  <button
                    key={tag.id}
                    onClick={() => setSelectedTag(selectedTag === tag.name ? null : tag.name)}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedTag === tag.name
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <HashIcon className="w-3 h-3" />
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 重置过滤器 */}
            {hasActiveFilters && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedVisibility('ALL')
                    setSelectedTag(null)
                  }}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  清除所有过滤器
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 备忘录列表 */}
      <div className="space-y-4">
        {memosLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : memos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <TagIcon className="w-12 h-12 mx-auto mb-4" />
              {hasActiveFilters ? '没有找到匹配的备忘录' : '还没有备忘录'}
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {hasActiveFilters ? '尝试调整过滤条件' : '点击上方按钮创建你的第一条备忘录'}
            </p>
            {!hasActiveFilters && (
              <button
                onClick={() => setShowEditor(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                新建备忘录
              </button>
            )}
          </div>
        ) : (
          memos.map((memo: Memo) => (
            <MemoCard key={memo.id} memo={memo} />
          ))
        )}
      </div>

      {/* 编辑器模态框 */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden">
                         <MemoEditor
               onSave={handleMemoCreated}
               onClose={() => setShowEditor(false)}
             />
          </div>
        </div>
      )}
    </div>
  )
} 