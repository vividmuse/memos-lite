import { useState } from 'react'
import { XIcon } from 'lucide-react'
import { memoApi, getErrorMessage } from '@/utils/api'

interface MemoEditorProps {
  onClose: () => void
  onSave: (memo: any) => void
  editingMemo?: any
}

export default function MemoEditor({ onClose, onSave, editingMemo }: MemoEditorProps) {
  const [content, setContent] = useState(editingMemo?.content || '')
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>(editingMemo?.visibility || 'PRIVATE')
  const [pinned, setPinned] = useState(editingMemo?.pinned === 1 || false)
  const [tags, setTags] = useState(editingMemo?.tags?.map((t: any) => t.name).join(', ') || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!content.trim()) {
      setError('内容不能为空')
      return
    }

    setLoading(true)
    setError('')

    try {
      const memoData = {
        content: content.trim(),
        visibility,
        pinned,
        tags: tags.split(',').map(t => t.trim()).filter(t => t)
      }

      let savedMemo
      if (editingMemo) {
        savedMemo = await memoApi.updateMemo(editingMemo.id, memoData)
      } else {
        savedMemo = await memoApi.createMemo(memoData)
      }

      onSave(savedMemo)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">
            {editingMemo ? '编辑备忘录' : '创建备忘录'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-accent transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-hidden flex flex-col p-4 space-y-4">
          {/* 内容编辑区 */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-foreground mb-2">
              内容
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="开始写你的备忘录..."
              className="w-full h-full min-h-[300px] p-3 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* 设置选项 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 可见性 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                可见性
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as 'PUBLIC' | 'PRIVATE')}
                className="w-full p-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="PRIVATE">私有</option>
                <option value="PUBLIC">公开</option>
              </select>
            </div>

            {/* 置顶 */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-sm font-medium text-foreground">置顶</span>
              </label>
            </div>

            {/* 标签 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                标签 (用逗号分隔)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="标签1, 标签2"
                className="w-full p-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        {/* 底部操作 */}
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
} 