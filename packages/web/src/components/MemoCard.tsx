import { Link } from 'react-router-dom'

export default function MemoCard({ memo }: { memo: any }) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const truncateContent = (content: string, maxLength = 200) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  return (
    <Link
      to={`/memo/${memo.id}`}
      className="block p-4 bg-card border border-border rounded-lg hover:shadow-md transition-shadow"
    >
      <div className="space-y-3">
        {/* 内容预览 */}
        <div className="text-foreground">
          <p className="text-sm leading-relaxed">
            {truncateContent(memo.content)}
          </p>
        </div>

        {/* 标签 */}
        {memo.tags && memo.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {memo.tags.slice(0, 3).map((tag: any) => (
              <span
                key={tag.id}
                className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs"
              >
                #{tag.name}
              </span>
            ))}
            {memo.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{memo.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* 底部信息 */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>@{memo.username}</span>
            <span>{formatDate(memo.created_at)}</span>
          </div>
          <div className="flex items-center gap-2">
            {memo.visibility === 'PUBLIC' && (
              <span className="px-2 py-1 bg-green-100 text-green-600 rounded">
                公开
              </span>
            )}
            {memo.pinned === 1 && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-600 rounded">
                置顶
              </span>
            )}
            {memo.comments_count > 0 && (
              <span>{memo.comments_count} 评论</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
} 