import { useState, useMemo } from 'react';

interface CalendarViewProps {
  memos: any[];
  onDateSelect?: (date: Date) => void;
}

export default function CalendarView({ memos, onDateSelect }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // 获取当前月份的日期信息
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // 当月第一天和最后一天
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 日历开始日期（可能是上月的日期）
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // 日历结束日期（可能是下月的日期）
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    // 生成日历数据
    const days = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dateStr = current.toDateString();
      const dayMemos = memos.filter(memo => {
        const memoDate = new Date(memo.created_at * 1000).toDateString();
        return memoDate === dateStr;
      });
      
      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        isToday: current.toDateString() === new Date().toDateString(),
        memos: dayMemos,
        memoCount: dayMemos.length
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [currentDate, memos]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ];

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="w-full">
      {/* 日历头部 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">
          {currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-accent rounded-md transition-colors"
          >
            ←
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-accent rounded-md transition-colors"
          >
            →
          </button>
        </div>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* 日历网格 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarData.map((day, index) => (
          <div
            key={index}
            className={`min-h-[100px] p-2 border border-border rounded-md cursor-pointer transition-colors ${
              day.isCurrentMonth 
                ? 'bg-background hover:bg-accent' 
                : 'bg-muted/20 text-muted-foreground'
            } ${
              day.isToday ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onDateSelect?.(day.date)}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-sm ${day.isToday ? 'font-bold text-primary' : ''}`}>
                {day.date.getDate()}
              </span>
              {day.memoCount > 0 && (
                <span className="text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                  {day.memoCount}
                </span>
              )}
            </div>
            
            {/* 显示当日备忘录摘要 */}
            <div className="space-y-1">
              {day.memos.slice(0, 2).map((memo: any) => (
                <div
                  key={memo.id}
                  className="text-xs p-1 bg-primary/10 rounded text-primary line-clamp-2"
                  title={memo.content}
                >
                  {memo.content.substring(0, 20)}...
                </div>
              ))}
              {day.memos.length > 2 && (
                <div className="text-xs text-muted-foreground">
                  +{day.memos.length - 2} 更多
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 图例 */}
      <div className="flex items-center justify-center space-x-6 mt-6 text-sm text-muted-foreground">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-primary rounded-full"></div>
          <span>今天</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-primary/10 rounded"></div>
          <span>有备忘录</span>
        </div>
      </div>
    </div>
  );
} 