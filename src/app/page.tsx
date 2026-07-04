"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { HomeNavbar } from "@/components/Layout/HomeNavbar";

export default function HomePage() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [teamCode, setTeamCode] = useState("");

  const handleJoin = () => {
    if (!teamCode.trim()) return;
    router.push(`/team/${teamCode.trim().toUpperCase()}/join`);
  };

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

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={() => router.push("/team/create")}
                className="h-12 rounded-full bg-[#425a7a] px-8 text-base font-semibold text-white shadow-lg shadow-[#425a7a]/15 hover:bg-[#344866]"
              >
                创建团队
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setOpen(true)}
                className="h-12 rounded-full border-[#d9dee8] bg-white/70 px-8 text-base font-semibold text-[#425a7a] shadow-sm hover:bg-white"
              >
                加入团队
              </Button>
            </div>

            <div className="mt-16 flex flex-wrap gap-4">
              {["自然对话", "十维能力", "陪伴探索", "团队视角"].map((label, index) => (
                <div key={label} className="flex items-center gap-2 rounded-full border border-[#dfe4ec] bg-white/60 px-4 py-2 text-sm font-semibold text-[#8a96aa] shadow-sm backdrop-blur">
                  <span className="text-xs">{["▢", "◈", "✣", "♙"][index]}</span>
                  {label}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative hidden min-h-[520px] items-center justify-center md:flex"
          >
            <div className="absolute right-0 top-6 h-[360px] w-[360px] rounded-full bg-white shadow-[0_30px_80px_rgba(242,170,114,0.18)] lg:h-[420px] lg:w-[420px]" />
            <div className="absolute right-16 top-24 h-[220px] w-[220px] rounded-full bg-[#fbf7ef] lg:right-20 lg:top-28 lg:h-[260px] lg:w-[260px]" />

            <div className="relative z-10 flex h-[180px] w-[180px] items-center justify-center rounded-full lg:h-[220px] lg:w-[220px]">
              <img src="/fox.png" alt="Foxity" width={164} height={164} className="rounded-3xl lg:h-[190px] lg:w-[190px]" />
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
            <DialogDescription>输入邀请码，加入你的团队开始测评。</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="teamCode">团队邀请码</Label>
            <Input
              id="teamCode"
              placeholder="例：FOX3A7"
              value={teamCode}
              onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>取消</Button>
            <Button variant="secondary" onClick={handleJoin}>进入加入页</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
