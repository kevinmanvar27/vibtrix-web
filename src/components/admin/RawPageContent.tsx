"use client";

import DOMPurify from "isomorphic-dompurify";

interface RawPageContentProps {
  content: string;
}

/**
 * Admin component to render page content with sanitization
 * XSS Protection: Uses DOMPurify to sanitize HTML before rendering
 */
export default function RawPageContent({ content }: RawPageContentProps) {
  // Sanitize HTML content to prevent XSS attacks
  const sanitizedContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'img', 'table', 'thead', 'tbody', 'tr', 'td', 'th'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style', 'src', 'alt', 'colspan', 'rowspan'],
    ADD_ATTR: ['target'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  });
  
  return (
    <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
  );
}
