"use client";

import { useCallback, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  Undo,
  Redo,
  Link as LinkIcon,
  Code as CodeIcon
} from "lucide-react";
import "./PageEditor.css";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface PageEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export default function PageEditor({ content, onChange }: PageEditorProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: {
          HTMLAttributes: {
            class: 'page-editor-code-block',
          },
          languageClassPrefix: 'language-',
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing page content...",
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'page-editor-image',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'page-editor-link',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false, // Fix for SSR hydration mismatches
  });

  const [htmlDialogOpen, setHtmlDialogOpen] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInsertHTML = useCallback(() => {
    if (!editor) return;
    setHtmlDialogOpen(true);
  }, [editor]);

  const insertHTML = () => {
    if (!editor || !htmlContent.trim()) {
      setHtmlDialogOpen(false);
      return;
    }

    // Insert HTML as a code block with language set to html
    editor.chain().focus().insertContent({
      type: 'codeBlock',
      attrs: { language: 'html' },
      content: [{ type: 'text', text: htmlContent }]
    }).run();

    // Reset and close dialog
    setHtmlContent('');
    setHtmlDialogOpen(false);
  };

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editor) return;

    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setIsUploading(true);

      // Create form data
      const formData = new FormData();
      formData.append('files', files[0]);

      // Upload file
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload image');
      }

      const result = await response.json();
      const imageUrl = result.files[0].url;

      // Insert image at current cursor position
      editor.chain().focus().setImage({ src: imageUrl }).run();

      // Clear the file input
      e.target.value = '';
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : 'Failed to upload image',
      });
    } finally {
      setIsUploading(false);
    }
  }, [editor, toast]);

  if (!editor) {
    return null;
  }

  return (
    <div className="page-editor">
      <Dialog open={htmlDialogOpen} onOpenChange={setHtmlDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Insert HTML</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <textarea
                ref={textareaRef}
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter your HTML code here..."
                onKeyDown={(e) => {
                  // Allow tab key for indentation
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const start = textareaRef.current?.selectionStart || 0;
                    const end = textareaRef.current?.selectionEnd || 0;
                    const value = textareaRef.current?.value || '';
                    const newValue = value.substring(0, start) + '  ' + value.substring(end);
                    setHtmlContent(newValue);
                    // Set cursor position after the inserted tab
                    setTimeout(() => {
                      if (textareaRef.current) {
                        textareaRef.current.selectionStart = start + 2;
                        textareaRef.current.selectionEnd = start + 2;
                      }
                    }, 0);
                  }
                }}
              />
            </div>
            {htmlContent && (
              <div className="border rounded-md p-4">
                <h3 className="text-sm font-medium mb-2">Preview:</h3>
                <div className="html-preview border p-2 rounded-md" dangerouslySetInnerHTML={{ __html: htmlContent }} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setHtmlDialogOpen(false)}>Cancel</Button>
            <Button type="button" onClick={insertHTML}>Insert HTML</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="page-editor-toolbar">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(editor.isActive('bold') ? 'bg-accent' : '')}
          type="button"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(editor.isActive('italic') ? 'bg-accent' : '')}
          type="button"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn(editor.isActive('heading', { level: 1 }) ? 'bg-accent' : '')}
          type="button"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(editor.isActive('heading', { level: 2 }) ? 'bg-accent' : '')}
          type="button"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn(editor.isActive('heading', { level: 3 }) ? 'bg-accent' : '')}
          type="button"
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(editor.isActive('bulletList') ? 'bg-accent' : '')}
          type="button"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(editor.isActive('orderedList') ? 'bg-accent' : '')}
          type="button"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const url = window.prompt('URL');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          className={cn(editor.isActive('link') ? 'bg-accent' : '')}
          type="button"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <div className="image-upload-button">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => document.getElementById('page-image-upload')?.click()}
            disabled={isUploading}
            type="button"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <input
            id="page-image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          type="button"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          type="button"
        >
          <Redo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleInsertHTML}
          className={cn(editor.isActive('codeBlock') ? 'bg-accent' : '')}
          type="button"
          title="Insert HTML"
        >
          <CodeIcon className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent
        editor={editor}
        className="page-editor-content"
      />
    </div>
  );
}
