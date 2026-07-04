"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Users, Target, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { HomeNavbar } from "@/components/Layout/HomeNavbar";

const features = [
  {
    icon: <Target className="h-6 w-6" />,
    title: "自适应测评",
    description: "AI 根据你的回答动态调整问题，不走固定流程。",
    tone: "from-fox-orange/10 to-fox-cream",
  },
  {
    icon: <LayersIcon className="h-6 w-6" />,
    title: "三层画像",
    description: "技能层 → 行为模式层 → 自我认知层，越聊越深。",
    tone: "from-fox-mint/10 to-fox-cream",
  },
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: "狐狸学长",
    description: "可爱但专业，会挑战你，不只迎合你。",
    tone: "from-fox-navy/10 to-fox-cream",
  },
];

function LayersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
      <path d="m22 12.65-9.17 4.17a2 2 0 0 1-1.66 0L2 12.65" />
      <path d="m22 17.65-9.17 4.17a2 2 0 0 1-1.66 0L2 17.65" />
    </svg>
  );
}

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
      <section className="mx-auto grid max-w-6xl gap-10 px-6 pb-20 pt-28 md:grid-cols-2 md:items-center md:pt-32">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="mb-6 flex items-center gap-2">
            <img src="/fox.png" alt="狐狸学长" width={48} height={48} className="rounded-xl" />
            <span className="text-lg font-bold text-fox-navy">狐狸学长</span>
          </div>

          <h1 className="text-balance text-4xl font-extrabold leading-tight text-fox-navy md:text-5xl">
            找到你在团队中的
            <span className="text-fox-orange">最佳位置</span>
          </h1>
          <p className="mt-4 text-base text-fox-gray md:text-lg">
            和 AI 学长聊 20 分钟，发现你没意识到的能力盲区。
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <Button size="lg" onClick={() => router.push("/team/create")} className="w-full justify-center">
              我是组织者，创建团队
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => setOpen(true)} className="w-full justify-center">
              我有邀请码，加入团队
            </Button>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + idx * 0.08 }}
                className={`rounded-2xl border border-fox-gray-light bg-gradient-to-br ${feature.tone} p-5 shadow-sm`}
              >
                <div className="mb-3 inline-flex rounded-xl bg-white/70 p-2 text-fox-navy">
                  {feature.icon}
                </div>
                <h3 className="text-sm font-bold text-fox-navy">{feature.title}</h3>
                <p className="mt-1 text-xs text-fox-gray">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative hidden items-center justify-center md:flex"
        >
          <div className="absolute -z-10 h-[420px] w-[420px] rounded-full bg-fox-orange/20 blur-3xl" />

          <div className="relative">
            <div className="flex h-[340px] w-[340px] items-center justify-center rounded-full bg-fox-cream shadow-xl">
              <img src="/fox.png" alt="狐狸学长" width={240} height={240} className="rounded-3xl" />
            </div>

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-6 top-8 rounded-full bg-white px-4 py-2 text-xs font-semibold text-fox-navy shadow-md"
            >
              📊 市场分析 8/10 ✅
            </motion.div>

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
              className="absolute -right-4 top-20 rounded-full bg-white px-4 py-2 text-xs font-semibold text-fox-navy shadow-md"
            >
              压力反应：行动型
            </motion.div>

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: 1.1 }}
              className="absolute bottom-8 left-6 rounded-full bg-white px-4 py-2 text-xs font-semibold text-fox-navy shadow-md"
            >
              💡 发现：你有产品思维潜力
            </motion.div>
          </div>
        </motion.div>
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
