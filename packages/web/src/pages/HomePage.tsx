import { useState, useEffect, useCallback } from 'react'
import { PlusIcon, RefreshCwIcon } from 'lucide-react'
import { memoApi, tagApi } from '@/utils/api'
import { useMemoStore, useTagStore } from '@/store'
import { Memo } from '@/types'
import MemoCard from '@/components/MemoCard'
import MemoEditor from '@/components/MemoEditor'

export default function HomePage() {
  const [showEditor, setShowEditor] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null)

  const { 
    memos, 
    loading: memosLoading, 
    setMemos, 
    setLoading: setMemosLoading,
    addMemo,
    updateMemo,
    removeMemo
  } = useMemoStore()
  
  const { setTags, setLoading: setTagsLoading } = useTagStore()

  // 使用 useCallback 避免无限循环
  const loadMemos = useCallback(async () => {
    setMemosLoading(true)
    try {
      const params = {
        limit: 50
      }
      
      console.log('Loading memos with params:', params)
      const result = await memoApi.getMemos(params)
      console.log('API response:', result)
      console.log('Memos array:', result)
      setMemos(result)
    } catch (error) {
      console.error('Failed to load memos:', error)
    } finally {
      setMemosLoading(false)
    }
  }, [setMemos, setMemosLoading])

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
    setEditingMemo(null)
    // 重新加载标签，因为可能有新标签
    loadTags()
    // 强制重新加载备忘录列表以确保同步
    setTimeout(() => {
      loadMemos()
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
      loadMemos()
    }, 100)
  }

  const handleEditMemo = (memo: Memo) => {
    setEditingMemo(memo)
    setShowEditor(true)
  }

  const handleDeleteMemo = async (memoId: number) => {
    if (!confirm('确定要删除这个备忘录吗？')) return
    
    try {
      await memoApi.deleteMemo(memoId)
      removeMemo(memoId)
      // 重新加载备忘录列表以确保同步
      setTimeout(() => {
        loadMemos()
      }, 100)
    } catch (error) {
      console.error('Failed to delete memo:', error)
      alert('删除失败，请重试')
    }
  }

  const handleArchiveMemo = async (memoId: number, archived: boolean) => {
    try {
      const memo = memos.find(m => m.id === memoId)
      if (!memo) return

      await memoApi.updateMemo(memoId, {
        state: archived ? 'ARCHIVED' : 'NORMAL'
      })
      
      // 重新加载备忘录列表以确保同步
      setTimeout(() => {
        loadMemos()
      }, 100)
    } catch (error) {
      console.error('Failed to archive memo:', error)
      alert('归档操作失败，请重试')
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadMemos()
    await loadTags()
    setRefreshing(false)
  }

  const handleCloseEditor = () => {
    setShowEditor(false)
    setEditingMemo(null)
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* 顶部编辑器区域 */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {showEditor ? (
          <div className="p-4">
            <MemoEditor 
              onClose={handleCloseEditor} 
              onSave={editingMemo ? handleMemoUpdated : handleMemoCreated}
              editingMemo={editingMemo}
            />
          </div>
        ) : (
          <div className="p-4">
            <button
              onClick={() => setShowEditor(true)}
              className="w-full text-left p-4 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 
                       border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-300 
                       dark:hover:border-blue-600 transition-colors duration-200"
            >
              此刻的想法...
            </button>
          </div>
        )}
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex">
        {/* 备忘录列表 */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* 列表头部 */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              备忘录
              {memos.length > 0 && (
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  ({memos.length})
                </span>
              )}
            </h2>
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

          {/* 备忘录列表内容 */}
          <div className="space-y-4">
            {memosLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-500 dark:text-gray-400">加载中...</div>
              </div>
            ) : memos.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 dark:text-gray-400 mb-4">
                  还没有备忘录
                </div>
                <button
                  onClick={() => setShowEditor(true)}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg 
                           hover:bg-blue-600 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>写下第一条备忘录</span>
                </button>
              </div>
            ) : (
              memos.map((memo: Memo) => (
                <MemoCard 
                  key={memo.id} 
                  memo={memo}
                  onEdit={handleEditMemo}
                  onDelete={handleDeleteMemo}
                  onArchive={handleArchiveMemo}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 