import { useState, useEffect } from 'react'
import { SearchIcon, TagIcon, FilterIcon } from 'lucide-react'
import { memoApi, tagApi } from '@/utils/api'
import { useMemoStore, useTagStore } from '@/store'
import MemoCard from '@/components/MemoCard'
import MemoEditor from '@/components/MemoEditor'

export default function HomePage() {
  const [showEditor, setShowEditor] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedVisibility, setSelectedVisibility] = useState<'ALL' | 'PUBLIC' | 'PRIVATE'>('ALL')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const { 
    memos, 
    loading: memosLoading, 
    setMemos, 
    setLoading: setMemosLoading,
    addMemo 
  } = useMemoStore()
  
  const { 
    tags, 
    loading: tagsLoading, 
    setTags, 
    setLoading: setTagsLoading 
  } = useTagStore()

  useEffect(() => {
    loadMemos()
    loadTags()
  }, [selectedVisibility, selectedTag, searchTerm])

  const loadMemos = async () => {
    setMemosLoading(true)
    try {
      const params = {
        visibility: selectedVisibility,
        tag: selectedTag || undefined,
        search: searchTerm || undefined,
        limit: 50
      }
      
      const result = await memoApi.getMemos(params)
      const memosData = Array.isArray(result) ? result : result.data
      setMemos(memosData)
    } catch (error) {
      console.error('Failed to load memos:', error)
    } finally {
      setMemosLoading(false)
    }
  }

  const loadTags = async () => {
    setTagsLoading(true)
    try {
      const tagsData = await tagApi.getTags()
      setTags(tagsData)
    } catch (error) {
      console.error('Failed to load tags:', error)
    } finally {
      setTagsLoading(false)
    }
  }

  const handleMemoCreated = (memo: any) => {
    addMemo(memo)
    setShowEditor(false)
  }

  return (
    <div className="h-full flex">
      {/* 左侧过滤面板 */}
      <div className="w-80 bg-card border-r border-border p-4 overflow-y-auto">
        <div className="space-y-6">
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
            <div className="space-y-1">
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
              {tags.map((tag) => (
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

        {/* 备忘录列表 */}
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
            <div className="space-y-4">
              {memos.map((memo) => (
                <MemoCard key={memo.id} memo={memo} />
              ))}
            </div>
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