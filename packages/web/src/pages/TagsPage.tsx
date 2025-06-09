import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { TagIcon, HashIcon, ArrowLeftIcon } from 'lucide-react'
import { memoApi, tagApi } from '@/utils/api'
import { useTagStore } from '@/store'
import { Memo, Tag } from '@/types'
import MemoCard from '@/components/MemoCard'

export default function TagsPage() {
  const { tagName } = useParams<{ tagName: string }>()
  const [loading, setLoading] = useState(false)
  const [tagMemos, setTagMemos] = useState<Memo[]>([])
  
  const { tags, setTags, setLoading: setTagsLoading } = useTagStore()

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

  const loadTagMemos = async (tag: string) => {
    setLoading(true)
    try {
      const result = await memoApi.getMemos({ tag })
      let memosData: Memo[] = []
      if (Array.isArray(result)) {
        memosData = result
      } else if (result && typeof result === 'object') {
        if ('data' in result) {
          memosData = (result as any).data || []
        } else if ('items' in result) {
          memosData = (result as any).items || []
        }
      }
      setTagMemos(memosData)
    } catch (error) {
      console.error('Failed to load tag memos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTags()
  }, [])

  useEffect(() => {
    if (tagName) {
      loadTagMemos(decodeURIComponent(tagName))
    }
  }, [tagName])

  // 计算每个标签的备忘录数量
  const getTagMemoCount = (tagName: string) => {
    // 这里可以通过API获取精确数量，目前返回标签数据中的计数
    const tag = tags.find(t => t.name === tagName)
    return tag?.memo_count || 0
  }

  if (tagName) {
    // 显示特定标签的备忘录
    return (
      <div className="space-y-6">
        {/* 页面头部 */}
        <div className="flex items-center gap-4">
          <Link
            to="/tags"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <HashIcon className="w-6 h-6 text-blue-600" />
              {decodeURIComponent(tagName)}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              共 {tagMemos.length} 条备忘录
            </p>
          </div>
        </div>

        {/* 备忘录列表 */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : tagMemos.length === 0 ? (
            <div className="text-center py-12">
              <TagIcon className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <p className="text-gray-500 dark:text-gray-400">
                这个标签下还没有备忘录
              </p>
            </div>
          ) : (
            tagMemos.map((memo) => (
              <MemoCard key={memo.id} memo={memo} />
            ))
          )}
        </div>
      </div>
    )
  }

  // 显示所有标签
  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">标签</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          浏览所有标签和对应的备忘录
        </p>
      </div>

      {/* 标签网格 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tags.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <TagIcon className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
            <p className="text-gray-500 dark:text-gray-400">
              还没有任何标签
            </p>
          </div>
        ) : (
          tags.map((tag: Tag) => (
            <Link
              key={tag.id}
              to={`/tags/${encodeURIComponent(tag.name)}`}
              className="block p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                  <HashIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {tag.name}
                  </h3>
                </div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {getTagMemoCount(tag.name)} 条备忘录
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
} 