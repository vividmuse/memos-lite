import { useState, useEffect, useCallback, useMemo } from 'react'
import { SearchIcon, PlusIcon, FilterIcon } from 'lucide-react'
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

  // 清除所有过滤器
  const clearAllFilters = () => {
    setSearchTerm('')
    setSelectedVisibility('ALL')
    setSelectedTag(null)
    setShowFilters(false)
  }

  return (
    <div className="space-y-6">
      {/* 写作区域 */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
        {showEditor ? (
          <div className="p-4">
            <MemoEditor 
              onSave={handleMemoCreated}
              onClose={() => setShowEditor(false)}
            />
          </div>
        ) : (
          <button
            onClick={() => setShowEditor(true)}
            className="w-full p-4 text-left text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <PlusIcon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">写下你的想法...</span>
            </div>
          </button>
        )}
      </div>

      {/* 搜索和过滤 */}
      <div className="space-y-3">
        {/* 主搜索栏 */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索备忘录..."
            className="w-full pl-10 pr-12 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
          {/* 过滤器按钮 */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-md transition-colors ${
              hasActiveFilters || showFilters
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <FilterIcon className="w-4 h-4" />
          </button>
        </div>

        {/* 过滤器面板 */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">过滤选项</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  清除全部
                </button>
              )}
            </div>

            {/* 可见性过滤 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                可见性
              </label>
              <div className="flex gap-1">
                {(['ALL', 'PUBLIC', 'PRIVATE'] as const).map((visibility) => (
                  <button
                    key={visibility}
                    onClick={() => setSelectedVisibility(visibility)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      selectedVisibility === visibility
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {visibility === 'ALL' ? '全部' : visibility === 'PUBLIC' ? '公开' : '私有'}
                  </button>
                ))}
              </div>
            </div>

            {/* 标签过滤 */}
            {tags.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  标签
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedTag(null)}
                    className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                      !selectedTag
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    全部标签
                  </button>
                  {tags.slice(0, 10).map((tag: Tag) => (
                    <button
                      key={tag.id}
                      onClick={() => setSelectedTag(selectedTag === tag.name ? null : tag.name)}
                      className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                        selectedTag === tag.name
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      #{tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 活跃过滤器显示 */}
        {hasActiveFilters && !showFilters && (
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <span>活跃过滤器:</span>
            {selectedVisibility !== 'ALL' && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                {selectedVisibility === 'PUBLIC' ? '公开' : '私有'}
              </span>
            )}
            {selectedTag && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                #{selectedTag}
              </span>
            )}
            {searchTerm && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                搜索: {searchTerm}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 统计信息 */}
      {memoStats.total > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          共 {memoStats.total} 条备忘录
          {memoStats.todayCount > 0 && (
            <span>，今日新增 {memoStats.todayCount} 条</span>
          )}
        </div>
      )}

      {/* 备忘录列表 */}
      <div className="space-y-4">
        {memosLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500 dark:text-gray-400">加载中...</div>
          </div>
        ) : memos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 mb-2">
              {hasActiveFilters ? '没有找到匹配的备忘录' : '还没有备忘录'}
            </div>
            {!hasActiveFilters && (
              <button
                onClick={() => setShowEditor(true)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                写下第一条备忘录
              </button>
            )}
          </div>
        ) : (
          memos.map((memo: Memo) => (
            <MemoCard 
              key={memo.id} 
              memo={memo}
              onEdit={(editMemo) => {
                // TODO: 实现编辑功能
                console.log('Edit memo:', editMemo)
              }}
            />
          ))
        )}
      </div>
    </div>
  )
} 