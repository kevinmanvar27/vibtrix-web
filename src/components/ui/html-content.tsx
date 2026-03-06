"use client";

import React from "react";
import { cn } from "@/lib/utils";
import DOMPurify from "isomorphic-dompurify";

interface HtmlContentProps {
  html: string;
  className?: string;
}

/**
 * Component to safely render HTML content
 * Use this for any content that comes from a rich text editor or contains HTML
 * XSS Protection: Uses DOMPurify to sanitize HTML before rendering
 */
export function HtmlContent({ html, className }: HtmlContentProps) {
  if (!html) return null;
  
  // Sanitize HTML content to prevent XSS attacks
  const sanitizedHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
    ADD_ATTR: ['target'],
    ADD_TAGS: ['iframe'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  });
  
  return (
    <div 
      className={cn("html-content", className)}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }} 
    />
  );
}
