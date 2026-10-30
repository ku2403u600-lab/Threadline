import React, { useMemo } from 'react';
import { marked } from 'marked';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const html = useMemo(() => {
    // Configure marked options for clean line breaks and security
    marked.setOptions({
      breaks: true,
      gfm: true,
    });
    return marked.parse(content || '') as string;
  }, [content]);

  return (
    <div
      className={`prose-threadline ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
