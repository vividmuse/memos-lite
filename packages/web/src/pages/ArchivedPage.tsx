import { useState, useEffect, useCallback } from 'react'
import { ArchiveIcon, RefreshCwIcon } from 'lucide-react'
import { memoApi } from '@/utils/api'
import { Memo } from '@/types'
import MemoCard from '@/components/MemoCard'
import { useMemoStore } from '@/store'
import { useDebounce } from '@/hooks/useDebounce'

export default function ArchivedPage() {
  const [memos, setMemos] = useState<Memo[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  
  const { searchTerm, selectedTags } = useMemoStore()
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // 加载归档的备忘录
  const loadArchivedMemos = useCallback(async (search?: string, tags?: string[]) => {
    setLoading(true)
    try {
      const params: any = {
        limit: 100,
        state: 'ARCHIVED' as const
      }
      
      // 如果有搜索词，添加到参数中
      if (search && search.trim()) {
        params.search = search.trim()
      }
      
      // 如果有选中的标签，构建标签查询
      if (tags && tags.length > 0) {
        params.tag = tags[0]
      }
      
      console.log('Loading archived memos with params:', params)
      const result = await memoApi.getMemos(params)
      console.log('Archived memos:', result)
      
      let filteredMemos = result || []
      
      // 如果有多个标签，在前端进一步过滤
      if (tags && tags.length > 1) {
        filteredMemos = filteredMemos.filter(memo => {
          return tags.every(tag => memo.content.includes(`#${tag}`))
        })
      }
      
      setMemos(filteredMemos)
    } catch (error) {
      console.error('Failed to load archived memos:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 首次加载
  useEffect(() => {
    loadArchivedMemos()
  }, [loadArchivedMemos])

  // 监听搜索词变化
  useEffect(() => {
    loadArchivedMemos(debouncedSearchTerm, selectedTags)
  }, [debouncedSearchTerm, selectedTags, loadArchivedMemos])

  const handleUnarchiveMemo = async (memoId: number) => {
    try {
      await memoApi.updateMemo(memoId, {
        state: 'NORMAL'
      })
      
      // 重新加载归档列表
      setTimeout(() => {
        loadArchivedMemos(debouncedSearchTerm, selectedTags)
      }, 100)
    } catch (error) {
      console.error('Failed to unarchive memo:', error)
      alert('取消归档失败，请重试')
    }
  }

  const handleDeleteMemo = async (memoId: number) => {
    if (!confirm('确定要永久删除这个归档的备忘录吗？此操作无法撤销。')) return
    
    try {
      await memoApi.deleteMemo(memoId)
      // 重新加载归档列表
      setTimeout(() => {
        loadArchivedMemos(debouncedSearchTerm, selectedTags)
      }, 100)
    } catch (error) {
      console.error('Failed to delete memo:', error)
      alert('删除失败，请重试')
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadArchivedMemos(debouncedSearchTerm, selectedTags)
    setRefreshing(false)
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {/* 头部 */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <ArchiveIcon className="w-5 h-5 mr-2" />
              归档的备忘录
              {memos.length > 0 && (
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  ({memos.length}{searchTerm.trim() && ' 搜索结果'})
                </span>
              )}
              {searchTerm.trim() && (
                <span className="ml-2 text-sm text-blue-600 dark:text-blue-400">
                  搜索: "{searchTerm.trim()}"
                </span>
              )}
              {selectedTags.length > 0 && (
                <span className="ml-2 text-sm text-green-600 dark:text-green-400">
                  标签: {selectedTags.map(tag => `#${tag}`).join(', ')}
                </span>
              )}
            </h2>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
            >
              <RefreshCwIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* 归档的备忘录列表 */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="text-gray-500 dark:text-gray-400">加载中...</div>
              </div>
            ) : memos.length === 0 ? (
              <div className="text-center py-8">
                <ArchiveIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <div className="text-gray-500 dark:text-gray-400">
                  {searchTerm.trim() || selectedTags.length > 0 ? '没有找到符合条件的归档备忘录' : '还没有归档的备忘录'}
                </div>
              </div>
            ) : (
              memos.map((memo) => (
                <MemoCard
                  key={memo.id}
                  memo={memo}
                  onEdit={() => {}} // 归档的备忘录不允许编辑
                  onDelete={handleDeleteMemo}
                  onArchive={(memoId, archived) => {
                    if (!archived) {
                      handleUnarchiveMemo(memoId)
                    }
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 