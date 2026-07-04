"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Users, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CreateTeamSkeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/store/useStore";
import { CopyButton } from "@/components/CopyButton";
import { useAuth } from "@/lib/auth";

export default function CreateTeamPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const createTeam = useStore((state) => state.createTeam);

  const [teamName, setTeamName] = useState("");
  const [teamCode, setTeamCode] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const organizerName = user?.name || "";
    if (!organizerName.trim()) {
      setError("无法获取用户姓名，请重新登录后再试");
      return;
    }
    if (!teamName.trim() || creating) return;
    setCreating(true);
    try {
      const code = await createTeam(teamName.trim(), "默认", organizerName.trim());
      setTeamCode(code);
    } catch (e) {
      setError("生成团队码失败，请重试");
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const inviteLink = teamCode ? `${mounted ? window.location.origin : ""}/team/${teamCode}/join` : "";

  if (loading) {
    return <CreateTeamSkeleton />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-lg">
        <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回首页
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{teamCode ? "团队码生成成功" : "创建团队"}</CardTitle>
            <CardDescription>
              {teamCode
                ? "把链接发给队友，他们完成测评后你就能看到全队能力矩阵。"
                : "填写团队信息，生成团队码。创建者默认是队长。"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!teamCode ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="teamName">团队名称</Label>
                  <Input
                    id="teamName"
                    placeholder="请输入团队名称"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}

                <Button type="submit" variant="secondary" className="w-full" disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    "生成团队码"
                  )}
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
                  <Button variant="secondary" onClick={() => router.push(`/team/${teamCode}/join`)}>
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
