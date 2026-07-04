"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/store/useStore";
import { mockTeam } from "@/mock/data";
import { useAuth } from "@/lib/auth";

export default function JoinTeamPage() {
  const params = useParams<{ teamId: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const teams = useStore((state) => state.teams);
  const joinTeam = useStore((state) => state.joinTeam);

  const team = teams.find((item) => item.team_id === params.teamId) ?? mockTeam;
  const [name, setName] = useState("");
  const [joining, setJoining] = useState(false);

  const handleStart = async (userName: string) => {
    if (!userName.trim() || joining) return;
    setJoining(true);
    try {
      await joinTeam(params.teamId, userName.trim());
      router.push(`/chat/${params.teamId}?user=${encodeURIComponent(userName.trim())}`);
    } finally {
      setJoining(false);
    }
  };

  // 已登录用户自动加入团队并跳转
  useEffect(() => {
    if (!loading && user?.name) {
      handleStart(user.name);
    }
  }, [loading, user]);

  if (loading || (user?.name && !joining)) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fox-gray" />
      </main>
    );
  }

  // 未登录用户显示姓名输入表单
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md">
        <Card>
          <CardHeader className="items-center text-center">
            <img src="/fox.png" alt="Foxity" width={64} height={64} className="rounded-2xl" />
            <CardTitle className="mt-3">欢迎加入团队！</CardTitle>
            <CardDescription>
              团队：{team.team_name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">姓名</Label>
              <Input
                id="name"
                placeholder="请输入姓名"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStart(name)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Button variant="secondary" onClick={() => handleStart(name)} disabled={!name.trim() || joining}>
                {joining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    加入中...
                  </>
                ) : (
                  "开始测评"
                )}
              </Button>
              <Button variant="ghost" onClick={() => router.push("/")}>
                稍后再测
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
