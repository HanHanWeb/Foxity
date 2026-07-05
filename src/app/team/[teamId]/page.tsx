"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users, Share2, Eye, EyeOff, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TeamMatrix } from "@/components/TeamMatrix";
import { CopyButton } from "@/components/CopyButton";
import { useStore } from "@/store/useStore";
import { mockProfiles, mockTeam } from "@/mock/data";
import type { UserProfile } from "@/types";
import { hardSkillLabels, hardSkillMeta } from "@/types";
import { cn } from "@/lib/utils";

export default function TeamDashboardPage() {
  const params = useParams<{ teamId: string }>();
  const router = useRouter();
  const teams = useStore((state) => state.teams);
  const profiles = useStore((state) => state.profiles);
  const loadTeam = useStore((state) => state.loadTeam);
  const [showRealNames, setShowRealNames] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [shared, setShared] = useState(false);
  const [loadingTeam, setLoadingTeam] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingTeam(true);
    loadTeam(params.teamId).finally(() => {
      if (!cancelled) setLoadingTeam(false);
    });
    return () => { cancelled = true; };
  }, [params.teamId, loadTeam]);

  const realTeam = teams.find((item) => item.team_id === params.teamId);
  const team = loadingTeam ? null : (realTeam ?? mockTeam);
  const teamProfiles = !loadingTeam && realTeam
    ? profiles.filter((p) => p.team_id === params.teamId)
    : (!loadingTeam ? mockProfiles : []);

  useEffect(() => {
    if (team?.team_name) {
      document.title = `${team.team_name} - 团队看板 - Foxity`;
    }
    return () => {
      document.title = "Foxity";
    };
  }, [team?.team_name]);

  const completedCount = teamProfiles.filter(
    (p) => (Object.values(p.abilities || {}) as any[]).filter((a) => a.verification_status !== "untested").length >= 3
  ).length;

  const inviteLink = `${mounted ? window.location.origin : ""}/team/${params.teamId}/join`;

  // 分享功能：复制本页链接
  const handleShare = async () => {
    const pageLink = `${mounted ? window.location.origin : ""}/team/${params.teamId}`;
    try {
      await navigator.clipboard.writeText(pageLink);
      setShared(true);
      setTimeout(() => setShared(false), 1500);
    } catch {
      // 忽略
    }
  };

  const displayProfiles: UserProfile[] = teamProfiles.map((p, idx) => ({
    ...p,
    user_name: showRealNames ? p.user_name : `成员${idx + 1}`,
  }));

  // 基于真实数据计算各维度均分、互补度、风险
  const completedProfiles = displayProfiles.filter(
    (p) => (Object.values(p.abilities || {}) as any[]).filter((a) => a.verification_status !== "untested").length >= 3
  );

  const dimStats = hardSkillMeta.map((dim) => {
    const scores = completedProfiles
      .map((p) => p.abilities?.[dim.key]?.score)
      .filter((s): s is number => typeof s === "number" && s > 0);
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const max = scores.length > 0 ? Math.max(...scores) : 0;
    const highCount = scores.filter((s) => s >= 75).length;
    return { key: dim.key, name: dim.name, avg, max, highCount, total: scores.length };
  });

  // 互补度：维度覆盖（有几个维度有人>=70）+ 分数分散度
  const coveredDims = dimStats.filter((d) => d.max >= 70).length;
  const dimVariance = (() => {
    const avgs = dimStats.map((d) => d.avg).filter((a) => a > 0);
    if (avgs.length < 2) return 0;
    const mean = avgs.reduce((a, b) => a + b, 0) / avgs.length;
    return Math.sqrt(avgs.reduce((sum, a) => sum + (a - mean) ** 2, 0) / avgs.length);
  })();
  const complementarity = Math.min(
    95,
    Math.round(coveredDims * 12 + Math.min(dimVariance * 2, 35) + (completedProfiles.length > 1 ? 10 : 0))
  );

  // 风险提示：均分低于 50 且没人拿到高分
  const risks = dimStats
    .filter((d) => d.avg > 0 && d.avg < 55 && d.highCount === 0)
    .map((d) => ({
      area: d.name,
      level: d.avg < 40 ? "high" as const : "medium" as const,
      desc:
        d.avg < 40
          ? `全队该维度均分仅 ${d.avg.toFixed(0)}，无人达到 75 分以上，存在明显能力短板。`
          : `全队该维度均分 ${d.avg.toFixed(0)}，整体偏弱，建议加强或补充相关背景成员。`,
    }));

  if (loadingTeam || !team) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-fox-cream/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-fox-orange" />
          <p className="text-sm text-fox-gray">加载团队数据...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-fox-cream/30 pb-12">
      <header className="border-b border-fox-gray-light bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              {shared ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  已复制
                </>
              ) : (
                <>
                  <Share2 className="mr-2 h-4 w-4" />
                  分享看板
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <div className="mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-fox-navy md:text-3xl">
                {team.team_emoji && <span className="mr-2">{team.team_emoji}</span>}
                {team.team_name}
              </h1>
              <p className="mt-1 text-sm text-fox-gray">
                团队码：<span className="font-mono font-bold text-fox-navy">{team.team_id}</span>
              </p>
            </div>

            <div className="flex w-full items-center gap-4 rounded-2xl border border-fox-gray-light bg-white p-4 md:w-auto">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fox-cream text-fox-orange">
                <Users className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-fox-navy">{completedCount}</span>
                  <span className="text-sm text-fox-gray">/ {teamProfiles.length} 人已完成</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-fox-gray-bg">
                  <div
                    className="h-full rounded-full bg-fox-orange transition-all duration-500"
                    style={{ width: `${teamProfiles.length > 0 ? (completedCount / teamProfiles.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-fox-gray-light bg-white p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-fox-navy">邀请链接</p>
              <p className="text-xs text-fox-gray">分享链接，邀请团队成员完成测评</p>
            </div>
            <div className="flex gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-lg bg-fox-gray-bg px-3 py-2 text-sm font-mono md:w-auto">
                {inviteLink}
              </div>
              <CopyButton value={inviteLink} label="" size="icon" />
            </div>
          </div>
        </div>

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
                    {hardSkillMeta.map((dim) => {
                      const count = displayProfiles.filter((p) => {
                        const abilities = Object.entries(p.abilities || {}) as [string, any][];
                        if (abilities.length === 0) return false;
                        const maxAbility = abilities.reduce((a, b) => a[1].score > b[1].score ? a : b);
                        return maxAbility[0] === dim.key;
                      }).length;
                      const percent = displayProfiles.length > 0 ? (count / displayProfiles.length) * 100 : 0;
                      return (
                        <div key={dim.key}>
                          <div className="mb-1 flex justify-between text-sm">
                            <span className="text-fox-navy">{dim.icon} {dim.name}</span>
                            <span className="text-fox-gray">{count}人</span>
                          </div>
                          <div className="h-3 rounded-full bg-fox-gray-bg overflow-hidden">
                            <div
                              style={{ width: `${percent}%` }}
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
                        {completedProfiles.length === 0 ? "--" : `${complementarity}%`}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-fox-navy">
                      {completedProfiles.length === 0
                        ? "暂无数据"
                        : complementarity >= 80
                        ? "互补度优秀"
                        : complementarity >= 60
                        ? "互补度良好"
                        : "互补度待提升"}
                    </p>
                    <p className="mt-1 text-center text-xs text-fox-gray">
                      {completedProfiles.length === 0
                        ? "等待队员完成测评后生成分析"
                        : `已有 ${completedProfiles.length} 人完成测评，覆盖 ${coveredDims} 个核心维度`}
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
                {completedProfiles.length === 0 ? (
                  <p className="py-6 text-center text-sm text-fox-gray">
                    等待队员完成测评后生成风险分析
                  </p>
                ) : risks.length === 0 ? (
                  <div className="flex items-center gap-3 rounded-xl border border-fox-mint/30 bg-fox-mint/5 p-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-fox-mint/15 text-lg">
                      ✅
                    </div>
                    <div>
                      <h4 className="font-semibold text-fox-navy">暂无明显风险</h4>
                      <p className="mt-1 text-sm text-fox-gray">
                        各维度能力覆盖均衡，未发现明显短板。
                      </p>
                    </div>
                  </div>
                ) : (
                  risks.map((risk, idx) => (
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
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <h2 className="text-lg font-bold text-fox-navy">成员列表</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {displayProfiles.map((profile, idx) => (
                <div key={profile.user_id}>
                  <Card className="cursor-pointer transition-all hover:shadow-md"
                    onClick={() => router.push(`/team/${params.teamId}/member/${profile.user_id}`)}
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
                        {Object.values(profile.abilities || {}).map((ability: any, i: number) => (
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
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
