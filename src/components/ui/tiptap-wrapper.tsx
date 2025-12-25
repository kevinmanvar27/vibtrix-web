"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

interface TipTapWrapperProps {
  content?: string;
  placeholder?: string;
  onChange?: (content: string) => void;
  className?: string;
  disabled?: boolean;
  onEditorReady?: (editor: any) => void;
}

export default function TipTapWrapper({
  content = "",
  placeholder = "Start typing...",
  onChange,
  className = "",
  disabled = false,
  onEditorReady,
}: TipTapWrapperProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bold: false,
        italic: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getText({ blockSeparator: "\n" }) || "");
    },
    immediatelyRender: false, // Fix for SSR hydration mismatches
  });

  // Call onEditorReady when editor is initialized
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  return (
    <EditorContent
      editor={editor}
      className={className}
      disabled={disabled}
    />
  );
}
