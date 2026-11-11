import React, { useMemo, useState } from 'react';
import { marked } from 'marked';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Configure marked options
  marked.setOptions({
    gfm: true,
    breaks: true,
  });

  const parsedHtml = useMemo(() => {
    try {
      return marked.parse(content || '') as string;
    } catch (e) {
      return content;
    }
  }, [content]);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => {
      setCopiedCodeId(null);
    }, 2000);
  };

  return (
    <div
      className="namma-markdown text-[15px] leading-relaxed break-words
        text-neutral-800 dark:text-neutral-100
        [&>p]:mb-3 [&>p:last-child]:mb-0
        [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-3 [&>ul]:space-y-1
        [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-3 [&>ol]:space-y-1
        [&>h1]:text-xl [&>h1]:font-semibold [&>h1]:mt-4 [&>h1]:mb-2
        [&>h2]:text-lg [&>h2]:font-semibold [&>h2]:mt-3 [&>h2]:mb-2
        [&>h3]:text-base [&>h3]:font-medium [&>h3]:mt-2 [&>h3]:mb-1
        [&>blockquote]:border-l-2 [&>blockquote]:border-amber-500/60 [&>blockquote]:pl-3 [&>blockquote]:italic [&>blockquote]:text-neutral-600 dark:[&>blockquote]:text-neutral-300 [&>blockquote]:my-2
        [&>pre]:bg-neutral-900 [&>pre]:text-neutral-100 [&>pre]:p-3 [&>pre]:rounded-lg [&>pre]:overflow-x-auto [&>pre]:my-3 [&>pre]:text-[13px] [&>pre]:font-mono
        [&_code]:font-mono [&_code]:text-[13px]
        [&_p>code]:bg-neutral-100 dark:[&_p>code]:bg-neutral-800 [&_p>code]:text-amber-800 dark:[&_p>code]:text-amber-300 [&_p>code]:px-1.5 [&_p>code]:py-0.5 [&_p>code]:rounded
        [&>table]:w-full [&>table]:border-collapse [&>table]:my-3 [&>table]:text-sm
        [&_th]:border [&_th]:border-neutral-200 dark:[&_th]:border-neutral-800 [&_th]:bg-neutral-50 dark:[&_th]:bg-neutral-800/60 [&_th]:p-2 [&_th]:text-left
        [&_td]:border [&_td]:border-neutral-200 dark:[&_td]:border-neutral-800 [&_td]:p-2
        [&>hr]:border-neutral-200 dark:[&>hr]:border-neutral-800 [&>hr]:my-4"
      dangerouslySetInnerHTML={{ __html: parsedHtml }}
    />
  );
};
