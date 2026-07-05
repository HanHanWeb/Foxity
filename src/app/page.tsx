"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, MessageCircle, Radar, Compass, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HomeNavbar } from "@/components/Layout/HomeNavbar";
import { JoinTeamDialog } from "@/components/JoinTeamDialog";
import { useAuth } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth(false);
  const [open, setOpen] = useState(false);

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
              携手 Foxity 共建团队，挖掘团队伙伴的专属闪光点。
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
              ].map((item, idx) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 + idx * 0.15 }}
                  className="flex items-center gap-2 rounded-full border border-[#dfe4ec] bg-white/60 px-4 py-2 text-sm font-semibold text-[#8a96aa] shadow-sm backdrop-blur"
                >
                  {item.icon}
                  {item.label}
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative flex min-h-[520px] items-center justify-center md:flex"
          >
            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative flex h-[360px] w-[360px] items-center justify-center rounded-full bg-white shadow-[0_30px_80px_rgba(242,170,114,0.18)] lg:h-[420px] lg:w-[420px]"
            >
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="flex h-[220px] w-[220px] items-center justify-center rounded-full bg-[#fbf7ef] lg:h-[260px] lg:w-[260px]"
              >
                <motion.img
                  src="/fox.png"
                  alt="Foxity"
                  width={164}
                  height={164}
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="rounded-3xl lg:h-[190px] lg:w-[190px]"
                />
              </motion.div>
            </motion.div>

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

      <JoinTeamDialog open={open} onOpenChange={setOpen} />

      <footer className="fixed inset-x-0 bottom-0 z-40 flex flex-col items-center gap-2 py-3">
        <div className="rounded-2xl bg-black px-3 py-1.5">
          <img src="/nextstep_white.png" alt="NextStep" className="h-3.5" />
        </div>
        <p className="text-xs text-fox-gray">Copyright © 好队 All rights reserved</p>
      </footer>
    </main>
  );
}
