"use client";

interface RawPageContentProps {
  content: string;
}

export default function RawPageContent({ content }: RawPageContentProps) {
  return (
    <div dangerouslySetInnerHTML={{ __html: content }} />
  );
}
