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
  
  const { searchTerm } = useMemoStore()
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // 加载归档的备忘录
  const loadArchivedMemos = useCallback(async (search?: string) => {
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
      
      console.log('Loading archived memos with params:', params)
      const result = await memoApi.getMemos(params)
      console.log('Archived memos:', result)
      setMemos(result)
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
    loadArchivedMemos(debouncedSearchTerm)
  }, [debouncedSearchTerm, loadArchivedMemos])

  const handleUnarchiveMemo = async (memoId: number) => {
    try {
      await memoApi.updateMemo(memoId, {
        state: 'NORMAL'
      })
      
      // 重新加载归档列表
      setTimeout(() => {
        loadArchivedMemos(debouncedSearchTerm)
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
        loadArchivedMemos(debouncedSearchTerm)
      }, 100)
    } catch (error) {
      console.error('Failed to delete memo:', error)
      alert('删除失败，请重试')
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadArchivedMemos(debouncedSearchTerm)
    setRefreshing(false)
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* 页面头部 */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ArchiveIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              归档备忘录
            </h1>
            {memos.length > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({memos.length} 条)
              </span>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 
                     hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <RefreshCwIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>刷新</span>
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          已归档的备忘录会被隐藏在主页面中，您可以在这里查看和管理它们。
        </p>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-500 dark:text-gray-400">加载中...</div>
              </div>
            ) : memos.length === 0 ? (
              <div className="text-center py-12">
                <ArchiveIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <div className="text-gray-500 dark:text-gray-400 mb-2">
                  没有归档的备忘录
                </div>
                <div className="text-sm text-gray-400 dark:text-gray-500">
                  当您归档备忘录时，它们会显示在这里
                </div>
              </div>
            ) : (
              memos.map((memo: Memo) => (
                <MemoCard 
                  key={memo.id} 
                  memo={memo}
                  onDelete={handleDeleteMemo}
                  onArchive={handleUnarchiveMemo}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 