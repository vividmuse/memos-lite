import { useState, useRef, useEffect } from 'react'
import { 
  XIcon, 
  BoldIcon, 
  ItalicIcon, 
  CodeIcon, 
  LinkIcon,
  ListIcon,
  CheckSquareIcon,
  HeadingIcon,
  ImageIcon,
  HelpCircleIcon
} from 'lucide-react'
import { memoApi, getErrorMessage } from '@/utils/api'
import MarkdownPreview from './MarkdownPreview'

interface MemoEditorProps {
  onClose: () => void
  onSave: (memo: any) => void
  editingMemo?: any
}

export default function MemoEditor({ onClose, onSave, editingMemo }: MemoEditorProps) {
  const [content, setContent] = useState('')
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PRIVATE')
  const [pinned, setPinned] = useState(false)
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [splitView, setSplitView] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 当editingMemo变化时，初始化表单数据
  useEffect(() => {
    if (editingMemo) {
      setContent(editingMemo.content || '')
      setVisibility(editingMemo.visibility || 'PRIVATE')
      setPinned(editingMemo.pinned === 1 || editingMemo.pinned === true)
      
      // 从内容中提取标签
      const tagRegex = /#([a-zA-Z0-9\u4e00-\u9fa5_-]+)/g
      const extractedTags = []
      let match
      while ((match = tagRegex.exec(editingMemo.content || '')) !== null) {
        extractedTags.push(match[1])
      }
      setTags(extractedTags.join(', '))
    } else {
      // 重置为新建状态
      setContent('')
      setVisibility('PRIVATE')
      setPinned(false)
      setTags('')
    }
  }, [editingMemo])

  // 处理快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault()
            handleSave()
            break
          case 'b':
            e.preventDefault()
            insertMarkdown('**', '**', '粗体文本')
            break
          case 'i':
            e.preventDefault()
            insertMarkdown('*', '*', '斜体文本')
            break
          case 'k':
            e.preventDefault()
            insertMarkdown('[', '](url)', '链接文本')
            break
          case 'Enter':
            e.preventDefault()
            handleSave()
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [content])

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
        tags: tags.split(',').map((t: string) => t.trim()).filter((t: string) => t)
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

  // 插入 Markdown 语法
  const insertMarkdown = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    const replacement = selectedText || placeholder

    const newContent = content.substring(0, start) + before + replacement + after + content.substring(end)
    setContent(newContent)

    // 重新聚焦并设置光标位置
    setTimeout(() => {
      textarea.focus()
      if (selectedText) {
        textarea.setSelectionRange(start + before.length, start + before.length + replacement.length)
      } else {
        textarea.setSelectionRange(start + before.length, start + before.length + placeholder.length)
      }
    }, 0)
  }

  // 快捷插入工具
  const toolbarActions = [
    {
      icon: HeadingIcon,
      title: '标题 (Ctrl+1)',
      action: () => insertMarkdown('# ', '', '标题')
    },
    {
      icon: BoldIcon,
      title: '粗体 (Ctrl+B)',
      action: () => insertMarkdown('**', '**', '粗体文本')
    },
    {
      icon: ItalicIcon,
      title: '斜体 (Ctrl+I)',
      action: () => insertMarkdown('*', '*', '斜体文本')
    },
    {
      icon: CodeIcon,
      title: '代码',
      action: () => insertMarkdown('`', '`', '代码')
    },
    {
      icon: LinkIcon,
      title: '链接 (Ctrl+K)',
      action: () => insertMarkdown('[', '](url)', '链接文本')
    },
    {
      icon: ListIcon,
      title: '列表',
      action: () => insertMarkdown('- ', '', '列表项')
    },
    {
      icon: CheckSquareIcon,
      title: '任务清单',
      action: () => insertMarkdown('- [ ] ', '', '待办事项')
    },
    {
      icon: ImageIcon,
      title: '图片',
      action: () => insertMarkdown('![', '](url)', '图片描述')
    }
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border-b border-border gap-3 sm:gap-4">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <h2 className="text-lg font-semibold">
              {editingMemo ? '编辑备忘录' : '创建备忘录'}
            </h2>
            
            {/* 视图切换 */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => {
                  setShowPreview(false)
                  setSplitView(false)
                }}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded transition-colors ${
                  !showPreview && !splitView 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent'
                }`}
              >
                编辑
              </button>
              <button
                onClick={() => {
                  setShowPreview(false)
                  setSplitView(true)
                }}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded transition-colors hidden sm:inline-block ${
                  splitView 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent'
                }`}
              >
                分栏
              </button>
              <button
                onClick={() => {
                  setShowPreview(true)
                  setSplitView(false)
                }}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded transition-colors ${
                  showPreview && !splitView 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent'
                }`}
              >
                预览
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-accent transition-colors self-start sm:self-auto"
          >
            <XIcon className="w-5 h-5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* 工具栏 */}
        {!showPreview && (
          <div className="p-2 border-b border-border">
            <div className="flex items-center space-x-1 overflow-x-auto">
              {toolbarActions.map((tool, index) => {
                const Icon = tool.icon
                return (
                  <button
                    key={index}
                    onClick={tool.action}
                    title={tool.title}
                    className="p-2 sm:p-2 rounded hover:bg-accent transition-colors flex-shrink-0"
                  >
                    <Icon className="w-5 h-5 sm:w-4 sm:h-4" />
                  </button>
                )
              })}
              
              <div className="w-px h-6 bg-border mx-2 flex-shrink-0" />
              
              <button
                onClick={() => window.open('https://www.markdownguide.org/basic-syntax/', '_blank')}
                className="p-2 sm:p-2 rounded hover:bg-accent transition-colors flex-shrink-0"
                title="Markdown 语法帮助"
              >
                <HelpCircleIcon className="w-5 h-5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 内容区 */}
        <div className="flex-1 overflow-hidden flex flex-col sm:flex-row">
          {/* 编辑器 */}
          {(!showPreview || splitView) && (
            <div className={`${splitView ? 'sm:w-1/2 sm:border-r border-border' : 'w-full'} flex flex-col p-3 sm:p-4 ${showPreview && splitView ? 'hidden sm:flex' : ''}`}>
              <label className="block text-sm font-medium text-foreground mb-2">
                内容 
                <span className="text-xs text-muted-foreground ml-2">
                  支持 Markdown 语法
                </span>
              </label>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="开始写你的备忘录...

支持的语法:
# 标题
**粗体** *斜体*
`代码`
- 列表
- [ ] 任务清单
[链接](url)
![图片](url)

快捷键:
Ctrl+S 保存
Ctrl+B 粗体
Ctrl+I 斜体
Ctrl+K 插入链接"
                className="flex-1 p-3 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none font-mono text-sm leading-relaxed"
                style={{ minHeight: '300px' }}
              />
            </div>
          )}

          {/* 预览区 */}
          {(showPreview || splitView) && (
            <div className={`${splitView ? 'sm:w-1/2' : 'w-full'} flex flex-col p-3 sm:p-4 ${!showPreview && splitView ? 'hidden sm:flex' : ''}`}>
              <label className="block text-sm font-medium text-foreground mb-2">
                预览
              </label>
              <div className="flex-1 border border-input rounded-md bg-background overflow-y-auto" style={{ minHeight: '300px' }}>
                <MarkdownPreview content={content} />
              </div>
            </div>
          )}
        </div>

        {/* 设置和操作区 */}
        <div className="p-3 sm:p-4 border-t border-border space-y-4">
          {/* 设置选项 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 可见性 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                可见性
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as 'PUBLIC' | 'PRIVATE')}
                className="w-full p-3 sm:p-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="PRIVATE">私有</option>
                <option value="PUBLIC">公开</option>
              </select>
            </div>

            {/* 置顶 */}
            <div>
              <label className="flex items-center space-x-2 pt-3 sm:pt-6">
                <input
                  type="checkbox"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                  className="w-4 h-4 text-primary focus:ring-primary border-border rounded"
                />
                <span className="text-sm text-foreground">置顶备忘录</span>
              </label>
            </div>

            {/* 标签 */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-foreground mb-2">
                标签 
                <span className="text-xs text-muted-foreground ml-1">
                  (用逗号分隔)
                </span>
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="标签1, 标签2"
                className="w-full p-3 sm:p-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
              {error}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end sm:space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 sm:py-2 border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || !content.trim()}
              className="px-6 py-3 sm:py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '保存中...' : (editingMemo ? '更新' : '创建')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 