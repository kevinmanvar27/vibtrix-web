"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface HtmlContentProps {
  html: string;
  className?: string;
}

/**
 * Component to safely render HTML content
 * Use this for any content that comes from a rich text editor or contains HTML
 */
export function HtmlContent({ html, className }: HtmlContentProps) {
  if (!html) return null;
  
  return (
    <div 
      className={cn("html-content", className)}
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  );
}
