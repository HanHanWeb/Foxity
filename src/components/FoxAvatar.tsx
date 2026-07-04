"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Expression } from "@/types";
import { cn } from "@/lib/utils";

interface FoxAvatarProps {
  expression?: Expression;
  size?: number;
  breathing?: boolean;
  blinking?: boolean;
  className?: string;
}

function FoxFace({ expression }: { expression: Expression }) {
  const baseEyes =
    expression === "curious" || expression === "surprised" ? (
      <>
        <circle cx="42" cy="48" r="6" fill="#2B4C7E" />
        <circle cx="78" cy="48" r="6" fill="#2B4C7E" />
        <circle cx="44" cy="46" r="2" fill="white" />
        <circle cx="80" cy="46" r="2" fill="white" />
      </>
    ) : expression === "serious" ? (
      <>
        <circle cx="42" cy="48" r="4.5" fill="#2B4C7E" />
        <circle cx="78" cy="48" r="4.5" fill="#2B4C7E" />
      </>
    ) : expression === "thinking" ? (
      <>
        <circle cx="46" cy="44" r="4" fill="#2B4C7E" />
        <circle cx="82" cy="44" r="4" fill="#2B4C7E" />
      </>
    ) : expression === "challenge" ? (
      <>
        <circle cx="42" cy="48" r="4.5" fill="#2B4C7E" />
        <line x1="74" y1="48" x2="82" y2="48" stroke="#2B4C7E" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M72 40 Q78 38 82 40" stroke="#2B4C7E" strokeWidth="2" fill="none" strokeLinecap="round" />
      </>
    ) : expression === "encourage" ? (
      <>
        <path d="M38 48 Q42 44 46 48" stroke="#2B4C7E" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M74 48 Q78 44 82 48" stroke="#2B4C7E" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      </>
    ) : (
      <>
        <path d="M36 48 Q42 42 48 48" stroke="#2B4C7E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M72 48 Q78 42 84 48" stroke="#2B4C7E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </>
    );

  const mouth = (() => {
    switch (expression) {
      case "smile":
        return <path d="M50 68 Q60 78 70 68" stroke="#2B4C7E" strokeWidth="2.5" fill="none" strokeLinecap="round" />;
      case "nod":
        return <path d="M46 66 Q60 82 74 66" stroke="#2B4C7E" strokeWidth="2.8" fill="none" strokeLinecap="round" />;
      case "thinking":
        return <path d="M52 70 Q60 68 68 72" stroke="#2B4C7E" strokeWidth="2.2" fill="none" strokeLinecap="round" />;
      case "curious":
        return <ellipse cx="60" cy="72" rx="5" ry="6" fill="#2B4C7E" />;
      case "surprised":
        return <ellipse cx="60" cy="72" rx="7" ry="9" fill="#2B4C7E" />;
      case "challenge":
        return <path d="M50 72 Q60 66 70 72" stroke="#2B4C7E" strokeWidth="2.5" fill="none" strokeLinecap="round" />;
      case "encourage":
        return <path d="M52 70 Q60 76 68 70" stroke="#2B4C7E" strokeWidth="2.2" fill="none" strokeLinecap="round" />;
      case "serious":
        return <line x1="50" y1="72" x2="70" y2="72" stroke="#2B4C7E" strokeWidth="2.5" strokeLinecap="round" />;
      default:
        return null;
    }
  })();

  const extra = expression === "thinking" ? (
    <g>
      <circle cx="92" cy="68" r="6" fill="#FFB87A" />
      <circle cx="96" cy="60" r="4" fill="#FF9F4D" />
    </g>
  ) : null;

  const earRotate = expression === "curious" ? -4 : 0;

  return (
    <svg viewBox="0 0 120 120" className="h-full w-full drop-shadow-sm">
      <defs>
        <radialGradient id="faceGlow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#FFB87A" />
          <stop offset="100%" stopColor="#FF9F4D" />
        </radialGradient>
      </defs>

      <path d="M30 28 L42 12 L54 30 Z" fill="#FF9F4D" transform={`rotate(${earRotate} 42 20)`} />
      <path d="M90 28 L78 12 L66 30 Z" fill="#FF9F4D" transform={`rotate(${-earRotate} 78 20)`} />
      <path d="M36 26 L42 18 L48 28 Z" fill="#FFB87A" transform={`rotate(${earRotate} 42 22)`} />
      <path d="M84 26 L78 18 L72 28 Z" fill="#FFB87A" transform={`rotate(${-earRotate} 78 22)`} />

      <ellipse cx="60" cy="58" rx="36" ry="34" fill="url(#faceGlow)" />
      <ellipse cx="60" cy="66" rx="22" ry="20" fill="#FFF8F0" />

      {baseEyes}

      <ellipse cx="60" cy="58" rx="5" ry="3.5" fill="#2B4C7E" opacity="0.9" />
      {mouth}

      <circle cx="36" cy="62" r="5" fill="#FFD93D" opacity="0.35" />
      <circle cx="84" cy="62" r="5" fill="#FFD93D" opacity="0.35" />

      <path d="M28 80 Q60 96 92 80 L92 96 Q60 108 28 96 Z" fill="#2B4C7E" />
      <circle cx="60" cy="90" r="5" fill="#FFD93D" />
      <path d="M57 88 L60 93 L63 88 M60 85 L60 95" stroke="#E88830" strokeWidth="1.2" strokeLinecap="round" />

      {extra}
    </svg>
  );
}

export function FoxAvatar({ expression = "smile", size = 80, breathing = true, blinking = true, className }: FoxAvatarProps) {
  const canBlink = blinking && expression !== "surprised" && expression !== "serious";

  return (
    <div className={cn("relative inline-flex items-center justify-center rounded-full bg-gradient-to-br from-fox-orange-light/40 via-fox-cream to-transparent", className)} style={{ width: size, height: size }}>
      <motion.div
        animate={breathing ? { scale: [1, 1.03, 1] } : { scale: 1 }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="h-full w-full"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={expression}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="h-full w-full"
          >
            <FoxFace expression={expression} />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {canBlink && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{ opacity: [1, 1, 0.15, 1] }}
          transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 6, times: [0, 0.85, 0.92, 1] }}
          initial={{ opacity: 1 }}
        />
      )}
    </div>
  );
}
