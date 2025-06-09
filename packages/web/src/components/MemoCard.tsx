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
  TagIcon
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
      return '刚刚'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} 小时前`
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)} 天前`
    } else {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
  }

  const formatFullDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN')
  }

  const truncateContent = (content: string, maxLength = 200) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(memo.content)
    // 可以添加成功提示
  }

  const hasCodeBlock = memo.content.includes('```')
  const hasTaskList = memo.content.includes('- [ ]') || memo.content.includes('- [x]')
  const hasMarkdown = /[*_`#\[\]!]/.test(memo.content)

  return (
    <div className="group bg-card border border-border rounded-lg hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* 头部信息 */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <span className="font-medium">@{memo.username}</span>
            <span>•</span>
            <span title={formatFullDate(memo.created_at)}>
              <CalendarIcon className="w-3 h-3 inline mr-1" />
              {formatDate(memo.created_at)}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* 状态标识 */}
            <div className="flex items-center space-x-1">
              {memo.pinned === 1 && (
                <div className="flex items-center px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                  <PinIcon className="w-3 h-3 mr-1" />
                  置顶
                </div>
              )}
              
              {memo.visibility === 'PUBLIC' ? (
                <div className="flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                  <EyeIcon className="w-3 h-3 mr-1" />
                  公开
                </div>
              ) : (
                <div className="flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                  <LockIcon className="w-3 h-3 mr-1" />
                  私有
                </div>
              )}
            </div>

            {/* 操作菜单 */}
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-1 opacity-0 group-hover:opacity-100 hover:bg-accent rounded transition-all"
              >
                <MoreHorizontalIcon className="w-4 h-4" />
              </button>
              
              {showActions && (
                <div className="absolute right-0 top-8 z-10 bg-popover border border-border rounded-md shadow-lg py-1 min-w-[120px]">
                  <button
                    onClick={() => {
                      setShowPreview(!showPreview)
                      setShowActions(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                  >
                    {showPreview ? '隐藏预览' : '显示预览'}
                  </button>
                  <button
                    onClick={() => {
                      copyToClipboard()
                      setShowActions(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                  >
                    <CopyIcon className="w-3 h-3 inline mr-2" />
                    复制内容
                  </button>
                  {onEdit && (
                    <button
                      onClick={() => {
                        onEdit(memo)
                        setShowActions(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                    >
                      <EditIcon className="w-3 h-3 inline mr-2" />
                      编辑
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="px-4 pb-3">
        {/* 内容预览/渲染 */}
        <div className="mb-3">
          {showPreview && hasMarkdown ? (
            <div className="border border-border rounded-md bg-background/50">
              <MarkdownPreview content={memo.content} />
            </div>
          ) : (
            <div className="text-foreground">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {truncateContent(memo.content)}
              </p>
            </div>
          )}
        </div>

        {/* 内容特性标识 */}
        {(hasCodeBlock || hasTaskList || hasMarkdown) && (
          <div className="flex items-center space-x-2 mb-3">
            {hasCodeBlock && (
              <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                代码
              </span>
            )}
            {hasTaskList && (
              <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                清单
              </span>
            )}
            {hasMarkdown && (
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs hover:bg-indigo-200 transition-colors"
              >
                {showPreview ? '原文' : '预览'}
              </button>
            )}
          </div>
        )}

        {/* 标签 */}
        {memo.tags && memo.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {memo.tags.slice(0, 5).map((tag: any) => (
              <Link
                key={tag.id}
                to={`/tags/${tag.name}`}
                className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary rounded-full text-xs hover:bg-primary/20 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <TagIcon className="w-3 h-3 mr-1" />
                {tag.name}
              </Link>
            ))}
            {memo.tags.length > 5 && (
              <span className="text-xs text-muted-foreground px-2 py-1">
                +{memo.tags.length - 5} 更多
              </span>
            )}
          </div>
        )}

        {/* 底部信息 */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-3">
            {memo.comments_count > 0 && (
              <div className="flex items-center space-x-1">
                <MessageSquareIcon className="w-3 h-3" />
                <span>{memo.comments_count}</span>
              </div>
            )}
            
            {memo.updated_at !== memo.created_at && (
              <span title={formatFullDate(memo.updated_at)}>
                已编辑
              </span>
            )}
          </div>

          <Link
            to={`/memo/${memo.id}`}
            className="text-primary hover:underline text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            查看详情 →
          </Link>
        </div>
      </div>
    </div>
  )
} 