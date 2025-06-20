import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  PinIcon, 
  EyeIcon, 
  LockIcon, 
  MessageSquareIcon,
  CopyIcon,
  EditIcon,
  MoreHorizontalIcon,
  HashIcon,
  ArchiveIcon,
  ArchiveRestoreIcon
} from 'lucide-react'
import MarkdownPreview from './MarkdownPreview'

interface MemoCardProps {
  memo: any
  onEdit?: (memo: any) => void
  onDelete?: (id: number) => void
  onArchive?: (id: number, archived: boolean) => void
}

export default function MemoCard({ memo, onEdit, onDelete, onArchive }: MemoCardProps) {
  const [showActions, setShowActions] = useState(false)

  const formatTime = (timestamp: number) => {
    if (!timestamp) return '未知时间'
    
    const now = new Date()
    const date = new Date(timestamp * 1000)
    
    // 验证日期是否有效
    if (isNaN(date.getTime())) {
      return '无效日期'
    }
    
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) {
      return '刚刚'
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}分钟前`
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}小时前`
    } else if (diffInSeconds < 2592000) {
      return `${Math.floor(diffInSeconds / 86400)}天前`
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

  // 获取用户信息 - 兼容新旧数据格式
  const getUserInfo = () => {
    // 优先从 creator 对象获取
    if (memo.creator) {
      return {
        name: memo.creator.name || memo.creator.username || memo.creator.nickname || '用户',
        avatar: (memo.creator.name || memo.creator.username || memo.creator.nickname || 'U').charAt(0).toUpperCase()
      }
    }
    // 从直接字段获取
    else if (memo.username) {
      return {
        name: memo.username,
        avatar: memo.username.charAt(0).toUpperCase()
      }
    }
    // 从 creatorId 推断（如果有的话）
    else if (memo.creatorId) {
      return {
        name: `用户${memo.creatorId}`,
        avatar: 'U'
      }
    }
    
    return {
      name: '匿名用户',
      avatar: 'A'
    }
  }

  // 获取时间戳 - 兼容新旧数据格式
  const getTimestamp = () => {
    // MoeMemos 格式：毫秒级时间戳
    if (memo.createdTs) {
      return Math.floor(memo.createdTs / 1000) // 转换为秒级时间戳
    }
    if (memo.updatedTs) {
      return Math.floor(memo.updatedTs / 1000)
    }
    if (memo.displayTs) {
      return Math.floor(memo.displayTs / 1000)
    }
    
    // 标准格式：秒级时间戳
    return memo.created_at || memo.updated_at || Math.floor(Date.now() / 1000)
  }

  const userInfo = getUserInfo()
  const timestamp = getTimestamp()

  const extractTags = (content: string) => {
    const tagRegex = /#([a-zA-Z0-9\u4e00-\u9fa5_-]+)/g
    const tags = []
    let match
    while ((match = tagRegex.exec(content)) !== null) {
      tags.push(match[1])
    }
    return tags
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(memo.content)
      // TODO: 显示复制成功提示
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  const tags = extractTags(memo.content)

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-4 hover:shadow-md transition-shadow ${
      memo.state === 'ARCHIVED' ? 'opacity-75 bg-gray-50 dark:bg-gray-900' : ''
    }`}>
      {/* 头部：用户信息、时间和操作 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          {/* 用户头像 */}
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-medium text-sm">{userInfo.avatar}</span>
          </div>
          
          {/* 用户名和时间 */}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {userInfo.name}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTime(timestamp)}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-1 flex-shrink-0">
          {/* 可见性图标 */}
          {memo.visibility === 'PRIVATE' ? (
            <LockIcon className="w-4 h-4 text-gray-400" />
          ) : (
            <EyeIcon className="w-4 h-4 text-gray-400" />
          )}
          
          {/* 置顶图标 */}
          {memo.pinned && (
            <PinIcon className="w-4 h-4 text-yellow-500" />
          )}

          {/* 更多操作 */}
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 sm:p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <MoreHorizontalIcon className="w-5 h-5 sm:w-4 sm:h-4 text-gray-400" />
            </button>

            {showActions && (
              <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-10 min-w-[140px]">
                <button
                  onClick={() => onEdit?.(memo)}
                  className="w-full flex items-center space-x-2 px-3 py-3 sm:py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <EditIcon className="w-4 h-4" />
                  <span>编辑</span>
                </button>
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center space-x-2 px-3 py-3 sm:py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <CopyIcon className="w-4 h-4" />
                  <span>复制</span>
                </button>
                {onArchive && (
                  <button
                    onClick={() => onArchive(memo.id, memo.state !== 'ARCHIVED')}
                    className="w-full flex items-center space-x-2 px-3 py-3 sm:py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {memo.state === 'ARCHIVED' ? (
                      <>
                        <ArchiveRestoreIcon className="w-4 h-4" />
                        <span>取消归档</span>
                      </>
                    ) : (
                      <>
                        <ArchiveIcon className="w-4 h-4" />
                        <span>归档</span>
                      </>
                    )}
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(memo.id)}
                    className="w-full flex items-center space-x-2 px-3 py-3 sm:py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <span>删除</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="mb-3">
        <MarkdownPreview content={memo.content} />
      </div>

      {/* 底部：标签和操作 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center flex-wrap gap-1">
          {tags.map((tag, index) => (
            <Link
              key={index}
              to={`/tags/${encodeURIComponent(tag)}`}
              className="inline-flex items-center space-x-1 px-2 py-1.5 sm:py-1 text-xs bg-blue-50 dark:bg-blue-900/30 
                       text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            >
              <HashIcon className="w-3 h-3" />
              <span>{tag}</span>
            </Link>
          ))}
        </div>

        <div className="flex items-center space-x-2 text-gray-400">
          {memo.comments_count > 0 && (
            <div className="flex items-center space-x-1">
              <MessageSquareIcon className="w-4 h-4" />
              <span className="text-xs">{memo.comments_count}</span>
            </div>
          )}
        </div>
      </div>

      {/* 点击外部区域关闭菜单 */}
      {showActions && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setShowActions(false)}
        />
      )}
    </div>
  )
} 