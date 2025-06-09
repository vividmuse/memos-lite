import { useMemo } from 'react';

interface MarkdownPreviewProps {
  content: string;
}

export default function MarkdownPreview({ content }: MarkdownPreviewProps) {
  // 简单的 Markdown 渲染器
  const renderedContent = useMemo(() => {
    if (!content) return '<p class="text-muted-foreground">开始写点什么...</p>';

    let html = content;

    // 转义 HTML 特殊字符
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 代码块 (```)
    html = html.replace(
      /```(\w+)?\n([\s\S]*?)```/g,
      '<pre class="bg-muted/50 border border-border rounded-md p-4 overflow-x-auto"><code class="text-sm font-mono">$2</code></pre>'
    );

    // 行内代码 (`)
    html = html.replace(
      /`([^`]+)`/g,
      '<code class="bg-muted/50 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>'
    );

    // 标题
    html = html.replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-6 mb-3">$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-6 mb-4">$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>');

    // 粗体和斜体
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

    // 链接
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // 图片
    html = html.replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      '<img src="$2" alt="$1" class="max-w-full h-auto rounded-md border border-border my-2" />'
    );

    // 任务列表
    html = html.replace(
      /^- \[ \] (.*)$/gm,
      '<div class="flex items-center space-x-2 my-1"><input type="checkbox" disabled class="rounded border-border"><span>$1</span></div>'
    );
    html = html.replace(
      /^- \[x\] (.*)$/gm,
      '<div class="flex items-center space-x-2 my-1"><input type="checkbox" checked disabled class="rounded border-border"><span class="line-through text-muted-foreground">$1</span></div>'
    );

    // 普通列表
    html = html.replace(/^- (.*)$/gm, '<li class="ml-4">$1</li>');
    html = html.replace(/(<li.*<\/li>)/s, '<ul class="list-disc list-inside space-y-1 my-2">$1</ul>');

    // 有序列表
    html = html.replace(/^\d+\. (.*)$/gm, '<li class="ml-4">$1</li>');

    // 引用
    html = html.replace(
      /^> (.*)$/gm,
      '<blockquote class="border-l-4 border-primary pl-4 italic text-muted-foreground my-2">$1</blockquote>'
    );

    // 分隔线
    html = html.replace(/^---$/gm, '<hr class="border-border my-4" />');

    // 标签高亮
    html = html.replace(
      /#(\w+)/g,
      '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">#$1</span>'
    );

    // 段落 (处理换行)
    const paragraphs = html.split('\n\n').filter(p => p.trim());
    html = paragraphs
      .map(p => {
        // 如果已经是块级元素，不包装 p 标签
        if (p.match(/^<(h[1-6]|ul|ol|blockquote|pre|div|hr)/)) {
          return p;
        }
        // 单行换行转为 br
        const withBreaks = p.replace(/\n/g, '<br />');
        return `<p class="mb-3 leading-relaxed">${withBreaks}</p>`;
      })
      .join('\n');

    return html;
  }, [content]);

  return (
    <div 
      className="prose prose-sm max-w-none p-4 text-foreground"
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
} 