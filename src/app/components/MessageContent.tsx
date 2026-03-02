"use client";

interface MessageContentProps {
  content: string;
  isUser: boolean;
}

export function MessageContent({ content, isUser }: MessageContentProps) {
  if (isUser) {
    // User messages: plain text
    return <p className="whitespace-pre-wrap">{content}</p>;
  }

  // Assistant messages: plain text (no markdown for now)
  return <p className="whitespace-pre-wrap">{content}</p>;
}

