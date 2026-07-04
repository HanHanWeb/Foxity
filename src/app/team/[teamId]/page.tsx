"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Share2, Copy, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TeamMatrix } from "@/components/TeamMatrix";
import { CopyButton } from "@/components/CopyButton";
import { useStore } from "@/store/useStore";
import { mockProfiles, mockTeam } from "@/mock/data";
import type { UserProfile } from "@/types";
import { cn } from "@/lib/utils";

export default function TeamDashboardPage() {
  const params = useParams<{ teamId: string }>();
  const router = useRouter();
  const teams = useStore((state) => state.teams);
  const profiles = useStore((state) => state.profiles);
  const [showRealNames, setShowRealNames] = useState(true);

  const team = teams.find((item) => item.team_id === params.teamId) ?? mockTeam;
  const teamProfiles = profiles.length > 0
    ? profiles.filter((p) => p.team_id === params.teamId)
    : mockProfiles;

  const completedCount = teamProfiles.filter(
    (p) => (Object.values(p.abilities) as any[]).filter((a) => a.verification_status !== "untested").length >= 3
  ).length;

  const inviteLink = `/team/${params.teamId}/join`;

  const displayProfiles: UserProfile[] = teamProfiles.map((p, idx) => ({
    ...p,
    user_name: showRealNames ? p.user_name : `成员${idx + 1}`,
  }));

  return (
    <main className="min-h-screen bg-fox-cream/30 pb-12">
      <header className="border-b border-fox-gray-light bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              分享看板
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <Badge variant="outline" className="mb-2">{team.competition_type}</Badge>
              <h1 className="text-2xl font-bold text-fox-navy md:text-3xl">{team.team_name}</h1>
              <p className="mt-1 text-sm text-fox-gray">
                团队码：<span className="font-mono font-bold text-fox-navy">{team.team_id}</span>
              </p>
            </div>

            <Card className="w-full md:w-auto">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-fox-orange/10 text-fox-orange">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-fox-navy">
                    {completedCount}/{teamProfiles.length}
                  </p>
                  <p className="text-xs text-fox-gray">已完成测评</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-fox-gray-light bg-white p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-fox-navy">邀请链接</p>
              <p className="text-xs text-fox-gray">把链接发给还没测评的队友</p>
            </div>
            <div className="flex gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-lg bg-fox-gray-bg px-3 py-2 text-sm font-mono md:w-auto">
                {inviteLink}
              </div>
              <CopyButton value={inviteLink} label="复制" />
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="matrix" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-3">
            <TabsTrigger value="matrix">能力矩阵</TabsTrigger>
            <TabsTrigger value="distribution">分布分析</TabsTrigger>
            <TabsTrigger value="members">成员列表</TabsTrigger>
          </TabsList>

          <TabsContent value="matrix" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-fox-navy">团队能力矩阵</h2>
                <p className="text-sm text-fox-gray">颜色越深代表能力越强</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRealNames(!showRealNames)}
                className="text-fox-gray"
              >
                {showRealNames ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                {showRealNames ? "匿名显示" : "显示真名"}
              </Button>
            </div>
            <TeamMatrix profiles={displayProfiles} />
          </TabsContent>

          <TabsContent value="distribution" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>能力最强项分布</CardTitle>
                  <CardDescription>各成员最强的能力维度</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {["background_market", "product", "tech", "finance", "design"].map((ability) => {
                      const count = displayProfiles.filter((p) => {
                        const abilities = Object.entries(p.abilities) as [string, any][];
                        const maxAbility = abilities.reduce((a, b) => a[1].score > b[1].score ? a : b);
                        return maxAbility[0] === ability;
                      }).length;
                      const percent = displayProfiles.length > 0 ? (count / displayProfiles.length) * 100 : 0;
                      const labels: Record<string, string> = {
                        background_market: "市场分析",
                        product: "产品思维",
                        tech: "技术能力",
                        finance: "商业/财务",
                        design: "设计能力",
                      };
                      return (
                        <div key={ability}>
                          <div className="mb-1 flex justify-between text-sm">
                            <span className="text-fox-navy">{labels[ability]}</span>
                            <span className="text-fox-gray">{count}人</span>
                          </div>
                          <div className="h-3 rounded-full bg-fox-gray-bg overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              transition={{ duration: 0.6 }}
                              className="h-full bg-fox-orange rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>团队互补度</CardTitle>
                  <CardDescription>能力多样性评估</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-fox-orange/10">
                      <span className="text-3xl font-bold text-fox-orange">
                        {Math.min(92, 70 + displayProfiles.length * 4)}%
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-fox-navy">互补度良好</p>
                    <p className="mt-1 text-center text-xs text-fox-gray">
                      团队成员能力各有侧重，
                      <br />
                      形成了较好的互补关系。
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>风险提示</CardTitle>
                <CardDescription>团队可能存在的能力盲区</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { area: "商业/财务", level: "high", desc: "全队没有人在财务维度拿到高分，建议补充相关背景成员或重点提升。" },
                  { area: "设计能力", level: "medium", desc: "设计能力整体中等偏下，可能影响产品原型的美观度和用户体验。" },
                ].map((risk, idx) => (
                  <div key={idx} className="flex gap-3 rounded-xl border border-fox-gray-light bg-white p-4">
                    <div
                      className={cn(
                        "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full",
                        risk.level === "high" ? "bg-fox-orange/20 text-fox-orange" : "bg-fox-yellow/20 text-fox-yellow-dark"
                      )}
                    >
                      ⚠️
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-fox-navy">{risk.area}能力不足</h4>
                        <Badge
                          className={cn(
                            "border-transparent",
                            risk.level === "high" ? "bg-fox-coral/15 text-fox-coral" : "bg-fox-yellow/20 text-fox-navy"
                          )}
                        >
                          {risk.level === "high" ? "高风险" : "中风险"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-fox-gray">{risk.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <h2 className="text-lg font-bold text-fox-navy">成员列表</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {displayProfiles.map((profile, idx) => (
                <motion.div
                  key={profile.user_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                >
                  <Card className="cursor-pointer transition-all hover:shadow-md"
                    onClick={() => router.push(`/profile/${params.teamId}?user=${encodeURIComponent(profile.user_id)}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-fox-cream text-lg font-bold text-fox-orange">
                          {profile.user_name[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-semibold text-fox-navy">{profile.user_name}</h3>
                          <Badge variant="outline" className="text-xs">{profile.core_positioning}</Badge>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-5 gap-1">
                        {Object.values(profile.abilities).map((ability: any, i: number) => (
                          <div key={i} className="text-center">
                            <div
                              className={cn(
                                "mx-auto h-6 w-6 rounded-full text-xs font-bold leading-6",
                                ability.verification_status === "untested"
                                  ? "bg-fox-gray-bg text-fox-gray-light"
                                  : ability.score >= 7
                                  ? "bg-fox-orange text-white"
                                  : ability.score >= 4
                                  ? "bg-fox-yellow text-white"
                                  : "bg-fox-gray text-white"
                              )}
                            >
                              {ability.verification_status === "untested" ? "-" : ability.score}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
