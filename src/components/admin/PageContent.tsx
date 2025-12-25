"use client";

import { cn } from "@/lib/utils";
import "./PageContent.css";
import { useEffect, useRef } from "react";
import DOMPurify from "isomorphic-dompurify";

interface PageContentProps {
  content: string;
  className?: string;
}

export default function PageContent({ content, className }: PageContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;

    // Find all code blocks with HTML language
    const codeBlocks = contentRef.current.querySelectorAll('pre > code.language-html');

    codeBlocks.forEach((codeBlock) => {
      const pre = codeBlock.parentElement;
      if (!pre) return;

      // Get the HTML content from the code block
      const htmlContent = codeBlock.textContent || '';

      // Create a container for the rendered HTML
      const container = document.createElement('div');
      container.className = 'html-content';
      // Sanitize HTML content before setting innerHTML
      container.innerHTML = DOMPurify.sanitize(htmlContent);

      // Insert the rendered HTML after the code block
      pre.parentNode?.insertBefore(container, pre.nextSibling);
    });
  }, [content]);

  // Sanitize content before rendering
  const sanitizedContent = DOMPurify.sanitize(content);

  return (
    <div
      ref={contentRef}
      className={cn("page-content", className)}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}
