import { useMemo } from 'react';
import { BarChart3Icon, CalendarIcon, TagIcon, EyeIcon, LockIcon } from 'lucide-react';

interface Memo {
  id: number;
  content: string;
  created_at: number;
  updated_at: number;
  visibility: 'PUBLIC' | 'PRIVATE';
  tags?: string[];
}

interface Tag {
  id: number;
  name: string;
  memo_count?: number;
}

interface StatsPanelProps {
  memos: Memo[];
  tags: Tag[];
}

export default function StatsPanel({ memos, tags }: StatsPanelProps) {
  // 计算各种统计数据
  const stats = useMemo(() => {
    const totalMemos = memos.length;
    const publicMemos = memos.filter(m => m.visibility === 'PUBLIC').length;
    const privateMemos = memos.filter(m => m.visibility === 'PRIVATE').length;
    
    // 按日期分组统计
    const memosByDate = memos.reduce((acc, memo) => {
      const date = new Date(memo.created_at * 1000).toDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 最近7天的统计
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      last7Days.push({
        date: dateStr,
        count: memosByDate[dateStr] || 0,
        label: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
      });
    }

    // 按月统计
    const memosByMonth = memos.reduce((acc, memo) => {
      const date = new Date(memo.created_at * 1000);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acc[monthKey] = (acc[monthKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 最近6个月
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      last6Months.push({
        month: monthKey,
        count: memosByMonth[monthKey] || 0,
        label: date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' })
      });
    }

    // 最活跃的标签
    const tagStats = tags
      .filter(tag => tag.memo_count && tag.memo_count > 0)
      .sort((a, b) => (b.memo_count || 0) - (a.memo_count || 0))
      .slice(0, 10);

    // 平均每日创建
    const firstMemo = memos.length > 0 ? Math.min(...memos.map(m => m.created_at)) : Date.now() / 1000;
    const daysSinceFirst = Math.max(1, Math.floor((Date.now() / 1000 - firstMemo) / 86400));
    const averagePerDay = totalMemos / daysSinceFirst;

    return {
      totalMemos,
      publicMemos,
      privateMemos,
      last7Days,
      last6Months,
      tagStats,
      averagePerDay: averagePerDay.toFixed(1),
      totalDays: daysSinceFirst
    };
  }, [memos, tags]);

  const maxDailyCount = Math.max(...stats.last7Days.map(d => d.count), 1);
  const maxMonthlyCount = Math.max(...stats.last6Months.map(m => m.count), 1);

  return (
    <div className="w-full space-y-6">
      {/* 总体统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <BarChart3Icon className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.totalMemos}</p>
              <p className="text-sm text-muted-foreground">总备忘录</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <EyeIcon className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats.publicMemos}</p>
              <p className="text-sm text-muted-foreground">公开</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <LockIcon className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{stats.privateMemos}</p>
              <p className="text-sm text-muted-foreground">私有</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{stats.averagePerDay}</p>
              <p className="text-sm text-muted-foreground">日均创建</p>
            </div>
          </div>
        </div>
      </div>

      {/* 最近7天统计 */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">最近7天</h3>
        <div className="flex items-end space-x-2 h-32">
          {stats.last7Days.map((day, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-primary rounded-t-md transition-all duration-300"
                style={{
                  height: `${(day.count / maxDailyCount) * 100}%`,
                  minHeight: day.count > 0 ? '8px' : '2px'
                }}
              />
              <div className="mt-2 text-xs text-center">
                <div className="font-medium">{day.count}</div>
                <div className="text-muted-foreground">{day.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 最近6个月统计 */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">最近6个月</h3>
        <div className="flex items-end space-x-2 h-40">
          {stats.last6Months.map((month, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-blue-500 rounded-t-md transition-all duration-300"
                style={{
                  height: `${(month.count / maxMonthlyCount) * 100}%`,
                  minHeight: month.count > 0 ? '8px' : '2px'
                }}
              />
              <div className="mt-2 text-xs text-center">
                <div className="font-medium">{month.count}</div>
                <div className="text-muted-foreground">{month.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 热门标签 */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">热门标签</h3>
        {stats.tagStats.length > 0 ? (
          <div className="space-y-2">
            {stats.tagStats.map((tag, index) => (
              <div key={tag.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                  <TagIcon className="w-4 h-4 text-primary" />
                  <span className="font-medium">{tag.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">{tag.memo_count} 个备忘录</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">暂无标签统计</p>
        )}
      </div>

      {/* 创作概览 */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">创作概览</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">创作天数:</span>
            <span className="ml-2 font-medium">{stats.totalDays} 天</span>
          </div>
          <div>
            <span className="text-muted-foreground">平均每日:</span>
            <span className="ml-2 font-medium">{stats.averagePerDay} 个</span>
          </div>
          <div>
            <span className="text-muted-foreground">最高单日:</span>
            <span className="ml-2 font-medium">{maxDailyCount} 个</span>
          </div>
          <div>
            <span className="text-muted-foreground">标签总数:</span>
            <span className="ml-2 font-medium">{stats.tagStats.length} 个</span>
          </div>
        </div>
      </div>
    </div>
  );
} 