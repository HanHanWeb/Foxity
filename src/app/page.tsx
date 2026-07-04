"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, MessageCircle, Radar, Compass, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HomeNavbar } from "@/components/Layout/HomeNavbar";
import { useAuth } from "@/lib/auth";

const CODE_LENGTH = 6;

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (open) {
      setDigits(Array(CODE_LENGTH).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [open]);

  const handleDigitChange = (index: number, value: string) => {
    const char = value.replace(/[^A-Za-z0-9]/g, "").slice(-1).toUpperCase();
    const next = [...digits];
    next[index] = char;
    setDigits(next);

    // 自动跳到下一格
    if (char && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // 输入满 6 位后自动跳转
    const code = next.join("");
    if (code.length === CODE_LENGTH && !next.includes("")) {
      setTimeout(() => {
        router.push(`/team/${code}/join`);
        setOpen(false);
      }, 300);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, CODE_LENGTH);
    const next = Array(CODE_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);
    if (pasted.length === CODE_LENGTH) {
      setTimeout(() => {
        router.push(`/team/${pasted}/join`);
        setOpen(false);
      }, 300);
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fox-gray" />
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <HomeNavbar />
      <section className="relative flex min-h-screen items-center overflow-hidden bg-[#fbf7ef] px-6 py-28">
        <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-fox-orange/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-10 right-12 h-72 w-72 rounded-full bg-fox-mint/10 blur-3xl" />

        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 md:grid-cols-[1fr_0.95fr]">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="mb-12 flex items-center gap-3">
              <img src="/fox.png" alt="Foxity" width={32} height={32} className="rounded-full" />
              <span className="text-base font-semibold text-[#8a96aa]">Foxity</span>
            </div>

            <h1 className="text-balance text-[44px] font-medium leading-[1.1] tracking-[-0.03em] text-[#425a7a] md:text-[64px]">
              团队中的你，
              <br />
              <span className="text-[#f2aa72]">比你想象的更特别</span>
            </h1>
            <p className="mt-8 text-lg font-medium text-[#9ca7b7] md:text-xl">
              和 Foxity 聊聊天，慢慢看清你在团队里的样子。
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                size="lg"
                onClick={() => setOpen(true)}
                className="h-12 min-w-[240px] rounded-full bg-[#425a7a] px-16 text-base font-semibold text-white shadow-lg shadow-[#425a7a]/15 hover:bg-[#344866]"
              >
                加入团队
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push("/team/create")}
                className="h-12 rounded-full border-[#d9dee8] bg-white/70 px-8 text-base font-semibold text-[#425a7a] shadow-sm hover:bg-white"
              >
                创建团队
              </Button>
            </div>

            <div className="mt-16 flex flex-wrap gap-4">
              {[
                { label: "自然对话", icon: <MessageCircle className="h-3.5 w-3.5" /> },
                { label: "十维能力", icon: <Radar className="h-3.5 w-3.5" /> },
                { label: "陪伴探索", icon: <Compass className="h-3.5 w-3.5" /> },
                { label: "团队视角", icon: <Users className="h-3.5 w-3.5" /> },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 rounded-full border border-[#dfe4ec] bg-white/60 px-4 py-2 text-sm font-semibold text-[#8a96aa] shadow-sm backdrop-blur">
                  {item.icon}
                  {item.label}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative flex min-h-[520px] items-center justify-center md:flex"
          >
            <div className="relative flex h-[360px] w-[360px] items-center justify-center rounded-full bg-white shadow-[0_30px_80px_rgba(242,170,114,0.18)] lg:h-[420px] lg:w-[420px]">
              <div className="flex h-[220px] w-[220px] items-center justify-center rounded-full bg-[#fbf7ef] lg:h-[260px] lg:w-[260px]">
                <img src="/fox.png" alt="Foxity" width={164} height={164} className="rounded-3xl lg:h-[190px] lg:w-[190px]" />
              </div>
            </div>

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-12 top-16 z-20 rounded-full bg-white/85 px-5 py-3 text-xs font-semibold text-[#8a96aa] shadow-lg shadow-[#425a7a]/5 backdrop-blur"
            >
              💬 你其实挺会沟通的
            </motion.div>

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute right-0 top-40 z-20 rounded-full bg-white/85 px-5 py-3 text-xs font-semibold text-[#8a96aa] shadow-lg shadow-[#425a7a]/5 backdrop-blur"
            >
              ✨ 这里可能需要你
            </motion.div>

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-20 left-16 z-20 rounded-full bg-white/85 px-5 py-3 text-xs font-semibold text-[#8a96aa] shadow-lg shadow-[#425a7a]/5 backdrop-blur"
            >
              📊 团队分析 8/10
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>加入团队</DialogTitle>
            <DialogDescription>输入 6 位团队邀请码，加入你的团队开始测评。</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center gap-2 py-4" onPaste={handlePaste}>
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="h-14 w-12 rounded-xl border-2 border-[#d9dee8] bg-white text-center text-2xl font-bold text-[#425a7a] outline-none transition-all focus:border-[#425a7a] focus:ring-2 focus:ring-[#425a7a]/15"
              />
            ))}
          </div>
          <p className="text-center text-xs text-fox-gray">输入完成后将自动加入团队</p>
        </DialogContent>
      </Dialog>

      <footer className="fixed inset-x-0 bottom-0 z-40 flex flex-col items-center gap-2 py-3">
        <div className="rounded-2xl bg-black px-3 py-1.5">
          <img src="/nextstep_white.png" alt="NextStep" className="h-3.5" />
        </div>
        <p className="text-xs text-fox-gray">Copyright © 好队 All rights reserved</p>
      </footer>
    </main>
  );
}
