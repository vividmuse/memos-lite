import { useState, useEffect, useCallback } from 'react'
import { PlusIcon, RefreshCwIcon } from 'lucide-react'
import { memoApi, tagApi } from '@/utils/api'
import { Memo } from '@/types'
import MemoCard from '@/components/MemoCard'
import MemoEditor from '@/components/MemoEditor'
import { useMemoStore, useTagStore } from '@/store'
import { useDebounce } from '@/hooks/useDebounce'

export default function HomePage() {
  const [showEditor, setShowEditor] = useState(false)
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  const { 
    memos, 
    loading: memosLoading, 
    setMemos, 
    setLoading: setMemosLoading,
    addMemo,
    updateMemo,
    removeMemo,
    searchTerm,
    selectedTags
  } = useMemoStore()
  
  const { setTags, setLoading: setTagsLoading } = useTagStore()

  // 使用 debounce 优化搜索性能
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // 使用 useCallback 避免无限循环
  const loadMemos = useCallback(async (search?: string, tags?: string[]) => {
    setMemosLoading(true)
    try {
      const params: any = {
        limit: 50,
        state: 'NORMAL' as const // 默认只显示正常状态的备忘录，不显示归档的
      }
      
      // 如果有搜索词，添加到参数中
      if (search && search.trim()) {
        params.search = search.trim()
      }
      
      // 如果有选中的标签，构建标签查询
      if (tags && tags.length > 0) {
        // 对于多个标签，我们可以用多个 tag 查询或者在前端过滤
        // 这里先使用第一个标签查询，然后在前端过滤
        params.tag = tags[0]
      }
      
      console.log('Loading memos with params:', params)
      const result = await memoApi.getMemos(params)
      console.log('API response:', result)
      
      let filteredMemos = result || []
      
      // 如果有多个标签，在前端进一步过滤
      if (tags && tags.length > 1) {
        filteredMemos = filteredMemos.filter(memo => {
          return tags.every(tag => memo.content.includes(`#${tag}`))
        })
      }
      
      console.log('Filtered memos:', filteredMemos)
      setMemos(filteredMemos)
    } catch (error) {
      console.error('Failed to load memos:', error)
    } finally {
      setMemosLoading(false)
    }
  }, [setMemos, setMemosLoading])

  const loadTags = useCallback(async () => {
    setTagsLoading(true)
    try {
      const result = await tagApi.getTags()
      if (Array.isArray(result)) {
        setTags(result)
      } else {
        setTags([])
      }
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

  // 监听搜索词变化
  useEffect(() => {
    loadMemos(debouncedSearchTerm, selectedTags)
  }, [debouncedSearchTerm, selectedTags, loadMemos])

  const handleMemoCreated = (memo: Memo) => {
    addMemo(memo)
    setShowEditor(false)
    setEditingMemo(null)
    // 重新加载标签，因为可能有新标签
    loadTags()
    // 强制重新加载备忘录列表以确保同步
    setTimeout(() => {
      loadMemos(debouncedSearchTerm, selectedTags)
    }, 100)
  }

  const handleMemoUpdated = (memo: Memo) => {
    updateMemo(memo.id, memo)
    setShowEditor(false)
    setEditingMemo(null)
    // 重新加载标签，因为可能有新标签
    loadTags()
    // 强制重新加载备忘录列表以确保同步
    setTimeout(() => {
      loadMemos(debouncedSearchTerm, selectedTags)
    }, 100)
  }

  const handleDeleteMemo = async (memoId: number) => {
    if (!confirm('确定要删除这个备忘录吗？')) return
    
    try {
      await memoApi.deleteMemo(memoId)
      removeMemo(memoId)
      // 重新加载备忘录列表以确保同步
      setTimeout(() => {
        loadMemos(debouncedSearchTerm, selectedTags)
      }, 100)
    } catch (error) {
      console.error('Failed to delete memo:', error)
      alert('删除失败，请重试')
    }
  }

  const handleArchiveMemo = async (memoId: number) => {
    try {
      await memoApi.updateMemo(memoId, {
        state: 'ARCHIVED'
      })
      
      // 重新加载备忘录列表以确保同步
      setTimeout(() => {
        loadMemos(debouncedSearchTerm, selectedTags)
      }, 100)
    } catch (error) {
      console.error('Failed to archive memo:', error)
      alert('归档失败，请重试')
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadMemos(debouncedSearchTerm, selectedTags)
    await loadTags()
    setRefreshing(false)
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-900">
      {/* 主内容区 */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* 备忘录列表 */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              {/* 头部 */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    备忘录
                    {memos.length > 0 && (
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                        ({memos.length}{searchTerm.trim() && ' 搜索结果'})
                      </span>
                    )}
                  </h2>
                  {searchTerm.trim() && (
                    <div className="mt-1 text-sm text-blue-600 dark:text-blue-400">
                      搜索: "{searchTerm.trim()}"
                    </div>
                  )}
                  {selectedTags.length > 0 && (
                    <div className="mt-1 text-sm text-green-600 dark:text-green-400">
                      标签: {selectedTags.map(tag => `#${tag}`).join(', ')}
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="p-3 sm:p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <RefreshCwIcon className={`w-5 h-5 sm:w-4 sm:h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setShowEditor(true)}
                    className="flex items-center space-x-2 px-4 py-3 sm:px-3 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <PlusIcon className="w-5 h-5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">新建</span>
                    <span className="sm:hidden">写</span>
                  </button>
                </div>
              </div>

              {/* 备忘录列表 */}
              <div className="space-y-4">
                {memosLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="text-gray-500 dark:text-gray-400">加载中...</div>
                  </div>
                ) : memos.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500 dark:text-gray-400 mb-4">
                      {searchTerm.trim() || selectedTags.length > 0 ? '没有找到符合条件的备忘录' : '还没有备忘录'}
                    </div>
                    {!searchTerm.trim() && selectedTags.length === 0 && (
                      <button
                        onClick={() => setShowEditor(true)}
                        className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        创建第一个备忘录
                      </button>
                    )}
                  </div>
                ) : (
                  memos.map((memo) => (
                    <MemoCard
                      key={memo.id}
                      memo={memo}
                      onEdit={(memo) => {
                        setEditingMemo(memo)
                        setShowEditor(true)
                      }}
                      onDelete={handleDeleteMemo}
                      onArchive={handleArchiveMemo}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 备忘录编辑器 */}
      {showEditor && (
        <MemoEditor
          editingMemo={editingMemo}
          onSave={editingMemo ? handleMemoUpdated : handleMemoCreated}
          onClose={() => {
            setShowEditor(false)
            setEditingMemo(null)
          }}
        />
      )}
    </div>
  )
} 