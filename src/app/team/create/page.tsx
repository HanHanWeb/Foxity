"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/store/useStore";
import { CopyButton } from "@/components/CopyButton";

export default function CreateTeamPage() {
  const router = useRouter();
  const createTeam = useStore((state) => state.createTeam);

  const [teamName, setTeamName] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [teamCode, setTeamCode] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!teamName.trim() || !organizerName.trim()) return;
    const code = createTeam(teamName.trim(), "默认", organizerName.trim());
    setTeamCode(code);
  };

  const inviteLink = teamCode ? `/team/${teamCode}/join` : "";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-lg">
        <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回首页
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{teamCode ? "邀请链接生成成功" : "创建团队"}</CardTitle>
            <CardDescription>
              {teamCode
                ? "把链接发给队友，他们完成测评后你就能看到全队能力矩阵。"
                : "填写团队信息，生成邀请链接。创建者默认是队长。"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!teamCode ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="teamName">团队名称</Label>
                  <Input
                    id="teamName"
                    placeholder="例：挑战杯-智慧农业项目组"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="organizer">你的名字</Label>
                  <Input
                    id="organizer"
                    placeholder="组织者姓名"
                    value={organizerName}
                    onChange={(e) => setOrganizerName(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" variant="secondary" className="w-full">
                  生成邀请链接
                </Button>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="rounded-2xl border border-fox-gray-light bg-fox-cream p-6 text-center">
                  <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-fox-mint" />
                  <p className="text-sm text-fox-gray">你的团队码</p>
                  <p className="mt-1 text-4xl font-bold text-fox-navy tracking-wider">{teamCode}</p>
                </div>

                <div className="space-y-2">
                  <Label>邀请链接</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={inviteLink} className="bg-fox-gray-bg" />
                    <CopyButton value={inviteLink} size="icon" />
                  </div>
                </div>

                <div className="grid gap-2 pt-2 md:grid-cols-2">
                  <Button variant="secondary" onClick={() => router.push(`/chat/${teamCode}`)}>
                    开始我的测评
                  </Button>
                  <Button variant="outline" onClick={() => router.push(`/team/${teamCode}`)}>
                    <Users className="mr-2 h-4 w-4" />
                    查看团队看板
                  </Button>
                </div>

                <p className="text-center text-xs text-fox-gray">
                  把链接发给队友，他们完成测评后你就能看到全队能力矩阵。
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
