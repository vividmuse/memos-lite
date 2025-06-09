import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  PinIcon, 
  EyeIcon, 
  LockIcon, 
  MessageSquareIcon, 
  CalendarIcon,
  CopyIcon,
  EditIcon,
  MoreHorizontalIcon,
  TagIcon,
  HashIcon,
  ClockIcon
} from 'lucide-react'
import MarkdownPreview from './MarkdownPreview'

interface MemoCardProps {
  memo: any
  onEdit?: (memo: any) => void
  onDelete?: (id: number) => void
}

export default function MemoCard({ memo, onEdit }: MemoCardProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [showActions, setShowActions] = useState(false)

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return diffInMinutes <= 0 ? '刚刚' : `${diffInMinutes} 分钟前`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} 小时前`
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)} 天前`
    } else {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(memo.content || '')
      // 可以添加成功提示
    } catch (err) {
      console.error('Failed to copy:', err)
    }
    setShowActions(false)
  }

  const hasMarkdown = memo.content ? /[*_`#\[\]!]/.test(memo.content) : false
  const isLongContent = memo.content?.length > 300

  return (
    <article className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all duration-200 group">
      {/* 头部信息 */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {/* 用户头像 */}
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-medium">
              {memo.username?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          
          {/* 用户信息和时间 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <span className="font-medium text-gray-900 dark:text-white text-sm">
              {memo.username || '匿名用户'}
            </span>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <ClockIcon className="w-3 h-3" />
              <time>{formatDate(memo.created_at)}</time>
            </div>
          </div>
        </div>

        {/* 状态和操作 */}
        <div className="flex items-center gap-2">
          {/* 状态标识 */}
          <div className="flex items-center gap-2">
            {memo.pinned === 1 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs">
                <PinIcon className="w-3 h-3" />
                <span className="hidden sm:inline">置顶</span>
              </div>
            )}
            
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
              memo.visibility === 'PUBLIC'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}>
              {memo.visibility === 'PUBLIC' ? (
                <>
                  <EyeIcon className="w-3 h-3" />
                  <span className="hidden sm:inline">公开</span>
                </>
              ) : (
                <>
                  <LockIcon className="w-3 h-3" />
                  <span className="hidden sm:inline">私有</span>
                </>
              )}
            </div>
          </div>

          {/* 操作菜单 */}
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
            >
              <MoreHorizontalIcon className="w-4 h-4" />
            </button>
            
            {showActions && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                <div className="absolute right-0 top-8 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[140px]">
                  <button
                    onClick={() => {
                      setShowPreview(!showPreview)
                      setShowActions(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <EyeIcon className="w-3 h-3" />
                    {showPreview ? '隐藏预览' : '显示预览'}
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <CopyIcon className="w-3 h-3" />
                    复制内容
                  </button>
                  {onEdit && (
                    <button
                      onClick={() => {
                        onEdit(memo)
                        setShowActions(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <EditIcon className="w-3 h-3" />
                      编辑
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 内容区域 */}
      <div className="px-4 py-4">
        {/* 内容预览/渲染 */}
        <div className="mb-4">
          {showPreview && hasMarkdown ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <MarkdownPreview content={memo.content} />
            </div>
          ) : (
            <div className="text-gray-900 dark:text-gray-100">
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {isLongContent && !showPreview 
                  ? memo.content?.substring(0, 300) + '...' 
                  : memo.content
                }
              </p>
              {isLongContent && !showPreview && (
                <button
                  onClick={() => setShowPreview(true)}
                  className="text-blue-600 dark:text-blue-400 text-sm mt-2 hover:underline"
                >
                  显示更多
                </button>
              )}
            </div>
          )}
        </div>

        {/* 标签 */}
        {memo.tags && memo.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {memo.tags.slice(0, 6).map((tag: any) => (
              <Link
                key={tag.id}
                to={`/tags/${encodeURIComponent(tag.name)}`}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <HashIcon className="w-3 h-3" />
                {tag.name}
              </Link>
            ))}
            {memo.tags.length > 6 && (
              <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs">
                +{memo.tags.length - 6}
              </span>
            )}
          </div>
        )}

        {/* 底部信息 */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            {/* Markdown 标识 */}
            {hasMarkdown && (
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                {showPreview ? '原文' : 'Markdown'}
              </button>
            )}
            
            {/* 评论数 */}
            {memo.comment_count > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquareIcon className="w-3 h-3" />
                <span>{memo.comment_count}</span>
              </div>
            )}
          </div>

          {/* 详情链接 */}
          <Link
            to={`/memo/${memo.id}`}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            查看详情
          </Link>
        </div>
      </div>
    </article>
  )
} 