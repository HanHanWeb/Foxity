"use client";

import { motion } from "framer-motion";

interface TagItem {
  text: string;
  importance: number;
}

interface TagCloudProps {
  tags: TagItem[];
}

export function TagCloud({ tags }: TagCloudProps) {
  const getSize = (importance: number) => {
    const minSize = 0.75;
    const maxSize = 1.4;
    const ratio = importance / 100;
    return minSize + (maxSize - minSize) * ratio;
  };

  const getTone = (idx: number) => {
    const tones = [
      "bg-fox-orange/15 text-fox-orange",
      "bg-fox-navy/10 text-fox-navy",
      "bg-fox-mint/20 text-fox-mint-dark",
      "bg-fox-yellow/30 text-fox-yellow-dark",
    ];
    return tones[idx % tones.length];
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5 py-4">
      {tags.map((tag, idx) => (
        <motion.span
          key={tag.text}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: idx * 0.04 }}
          whileHover={{ scale: 1.1 }}
          className={`cursor-default rounded-full px-4 py-1.5 font-semibold ${getTone(idx)}`}
          style={{ fontSize: `${getSize(tag.importance)}rem` }}
        >
          {tag.text}
        </motion.span>
      ))}
    </div>
  );
}
