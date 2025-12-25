"use client";

import { formatTextWithLinks } from "@/lib/text-formatter";
import React from "react";

interface LinkifyProps {
  children: React.ReactNode;
}

/**
 * Enhanced Linkify component that formats text with links, hashtags, and usernames
 * This is a consolidated version that replaces both Linkify and EnhancedLinkify
 */
export default function Linkify({ children }: LinkifyProps) {
  // If children is a string, use the formatter
  if (typeof children === "string") {
    return formatTextWithLinks(children);
  }

  // Otherwise, just return the children as is
  return children;
}
