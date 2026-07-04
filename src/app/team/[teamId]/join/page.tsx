"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/store/useStore";
import { mockTeam } from "@/mock/data";

export default function JoinTeamPage() {
  const params = useParams<{ teamId: string }>();
  const router = useRouter();
  const teams = useStore((state) => state.teams);
  const joinTeam = useStore((state) => state.joinTeam);

  const team = teams.find((item) => item.team_id === params.teamId) ?? mockTeam;
  const [name, setName] = useState("");

  const handleStart = () => {
    if (!name.trim()) return;
    const profile = joinTeam(params.teamId, name.trim());
    router.push(`/chat/${params.teamId}?user=${encodeURIComponent(name.trim())}`);
    void profile;
  };

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
              <Label htmlFor="name">你的名字</Label>
              <Input
                id="name"
                placeholder="你的名字"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStart()}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Button variant="secondary" onClick={handleStart} disabled={!name.trim()}>
                开始测评
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
