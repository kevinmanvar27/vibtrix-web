"use client";

import Link from "next/link";
import React from "react";

/**
 * Simple utility to format text with links, hashtags, and usernames
 * This avoids circular dependencies between components
 */
export function formatTextWithLinks(text: string): React.ReactNode {
  if (!text) return null;

  // Split text by spaces to process each word
  const words = text.split(/(\s+)/);

  return (
    <>
      {words.map((word, index) => {
        // Handle URLs
        if (word.match(/^(https?:\/\/|www\.)/i)) {
          const url = word.startsWith('www.') ? `https://${word}` : word;
          return (
            <React.Fragment key={index}>
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {word}
              </a>
            </React.Fragment>
          );
        }
        
        // Handle hashtags
        if (word.match(/^#[a-zA-Z0-9]+/)) {
          const tag = word.slice(1);
          return (
            <React.Fragment key={index}>
              <Link
                href={`/hashtag/${tag}`}
                className="text-primary font-medium hover:underline inline-flex items-center"
              >
                {word}
              </Link>
            </React.Fragment>
          );
        }
        
        // Handle usernames
        if (word.match(/^@[a-zA-Z0-9_-]+/)) {
          const username = word.slice(1);
          return (
            <React.Fragment key={index}>
              <Link
                href={`/users/${username}`}
                className="text-primary hover:underline"
              >
                {word}
              </Link>
            </React.Fragment>
          );
        }
        
        // Return regular text
        return <React.Fragment key={index}>{word}</React.Fragment>;
      })}
    </>
  );
}
