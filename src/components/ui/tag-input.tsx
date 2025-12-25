"use client";

import React, { useState, useRef, KeyboardEvent, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";

export interface TagInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function TagInput({
  value,
  onChange,
  placeholder = "Add tags...",
  className,
  disabled = false,
}: TagInputProps) {
  // Parse the comma-separated string into an array of tags
  const [tags, setTags] = useState<string[]>(() => {
    return value ? value.split(',').map(tag => tag.trim()).filter(Boolean) : [];
  });
  
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update the parent component when tags change
  useEffect(() => {
    onChange(tags.join(', '));
  }, [tags, onChange]);

  // Update local tags when value prop changes
  useEffect(() => {
    if (value !== tags.join(', ')) {
      setTags(value ? value.split(',').map(tag => tag.trim()).filter(Boolean) : []);
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    // Add tag on comma, Enter, or Space
    if (e.key === ',' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      addTag();
    }
    
    // Remove the last tag on Backspace if input is empty
    if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const addTag = () => {
    const trimmedInput = inputValue.trim();
    if (trimmedInput && !tags.includes(trimmedInput)) {
      setTags([...tags, trimmedInput]);
      setInputValue("");
    }
  };

  const removeTag = (indexToRemove: number) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      onClick={handleContainerClick}
    >
      {tags.map((tag, index) => (
        <Badge
          key={`${tag}-${index}`}
          variant="secondary"
          className="flex items-center gap-1 px-3 py-1"
        >
          {tag}
          {!disabled && (
            <X
              className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(index);
              }}
            />
          )}
        </Badge>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-20"
        disabled={disabled}
      />
    </div>
  );
}
