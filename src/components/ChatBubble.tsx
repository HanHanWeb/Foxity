"use client";

import { motion } from "framer-motion";
import { Paperclip } from "lucide-react";
import { FoxAvatar } from "@/components/FoxAvatar";
import type { ChatMessage } from "@/types";
import { formatFileSize } from "@/lib/utils";

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isAI = message.role === "ai";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`flex w-full ${isAI ? "justify-start" : "justify-end"}`}
    >
      <div className={`flex max-w-[80%] gap-3 ${isAI ? "flex-row" : "flex-row-reverse"}`}>
        {isAI && <FoxAvatar size={36} expression={message.expression} breathing={false} blinking />}

        <div className={`flex flex-col ${isAI ? "items-start" : "items-end"}`}>
          <div
            className={`rounded-2xl border border-fox-gray-light px-4 py-3 text-sm leading-relaxed ${
              isAI ? "bg-white text-gray-800 rounded-tl-sm" : "bg-fox-navy text-white rounded-tr-sm"
            }`}
          >
            {message.content}
          </div>

          {message.file && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-fox-gray-bg px-3 py-2 text-xs text-fox-gray">
              <Paperclip className="h-3.5 w-3.5" />
              <span className="font-medium text-fox-navy">{message.file.name}</span>
              <span>{formatFileSize(message.file.size)}</span>
            </div>
          )}

          {isAI && message.insights && message.insights.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {message.insights.map((insight, idx) => (
                <span key={idx} className="rounded-full bg-fox-cream px-3 py-1 text-xs text-fox-navy">
                  {insight}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
