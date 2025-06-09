import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, EditIcon, TrashIcon } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { memoApi, getErrorMessage } from '@/utils/api'

export default function MemoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [memo, setMemo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) {
      loadMemo(parseInt(id))
    }
  }, [id])

  const loadMemo = async (memoId: number) => {
    setLoading(true)
    setError('')
    try {
      const memoData = await memoApi.getMemo(memoId)
      setMemo(memoData)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!memo || !confirm('确定要删除这个备忘录吗？')) return
    
    try {
      await memoApi.deleteMemo(memo.id)
      navigate('/')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-destructive">{error}</div>
      </div>
    )
  }

  if (!memo) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground">备忘录不存在</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* 顶部操作栏 */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            返回
          </button>
          
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-md hover:bg-accent transition-colors">
              <EditIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={handleDelete}
              className="p-2 rounded-md hover:bg-accent text-destructive transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* 备忘录信息 */}
          <div className="mb-6">
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              <span>作者：{memo.username}</span>
              <span>创建于：{new Date(memo.created_at * 1000).toLocaleString()}</span>
              {memo.updated_at !== memo.created_at && (
                <span>更新于：{new Date(memo.updated_at * 1000).toLocaleString()}</span>
              )}
            </div>
            
            {memo.tags && memo.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {memo.tags.map((tag: any) => (
                  <span
                    key={tag.id}
                    className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs"
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 备忘录内容 */}
          <div className="prose prose-slate max-w-none">
            <ReactMarkdown>{memo.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
} 