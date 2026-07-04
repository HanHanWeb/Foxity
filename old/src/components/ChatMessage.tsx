"use client";

import { motion } from "framer-motion";
import { FoxAvatar } from "@/components/FoxAvatar";
import type { ChatMessage as ChatMessageType } from "@/types";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isFox = message.role === "fox";
  const isTyping = message.isTyping;

  return (
    <div className={`flex w-full gap-3 ${isFox ? "justify-start" : "justify-end"}`}>
      {isFox && (
        <FoxAvatar
          size={36}
          expression={message.emotion ?? "smile"}
          breathing={false}
          blinking
        />
      )}

      <div className={`max-w-[78%] ${isFox ? "items-start" : "items-end"}`}>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isFox
              ? "rounded-tl-sm border border-fox-gray-light bg-white text-fox-navy"
              : "rounded-tr-sm bg-fox-orange text-white"
          }`}
        >
          {isTyping ? (
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-fox-orange [animation-delay:0ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-fox-orange [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-fox-orange [animation-delay:300ms]" />
            </div>
          ) : (
            message.content
          )}
        </motion.div>
      </div>
    </div>
  );
}
