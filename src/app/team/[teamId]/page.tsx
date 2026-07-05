"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Users, Share2, Eye, EyeOff, Copy, Check,
  AlertTriangle, Shield, TrendingUp, BarChart3, PieChart,
} from "lucide-react";
import {
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/CopyButton";
import { useStore } from "@/store/useStore";
import { mockProfiles, mockTeam } from "@/mock/data";
import type { UserProfile } from "@/types";
import { cn } from "@/lib/utils";
import {
  generateMockTeamV3Profiles,
  CREDIBILITY_COLORS,
  TYPE_COLORS,
} from "@/lib/v3/mock";
import type { V3Profile, CredibilityLevel, HardSkillDimension } from "@/lib/scoring/types";
import { DIMENSION_LABELS, HARD_SKILL_DIMENSIONS } from "@/lib/scoring/types";

interface TeamMemberV3 {
  user_id: string;
  user_name: string;
  v3: V3Profile;
}

export default function TeamDashboardPage() {
  const params = useParams<{ teamId: string }>();
  const router = useRouter();
  const teams = useStore((state) => state.teams);
  const profiles = useStore((state) => state.profiles);
  const loadTeam = useStore((state) => state.loadTeam);
  const [showRealNames, setShowRealNames] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [shared, setShared] = useState(false);
  const [teamV3Data, setTeamV3Data] = useState<TeamMemberV3[]>([]);
  const [loadingV3, setLoadingV3] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    loadTeam(params.teamId);
  }, [params.teamId, loadTeam]);

  const team = teams.find((item) => item.team_id === params.teamId) ?? mockTeam;
  const teamProfiles = profiles.length > 0
    ? profiles.filter((p) => p.team_id === params.teamId)
    : mockProfiles;

  // 加载团队 V3 数据
  useEffect(() => {
    const loadV3Data = async () => {
      try {
        const res = await fetch(`/api/teams/${params.teamId}/v3-profiles`);
        if (res.ok) {
          const data = await res.json();
          if (data?.members) {
            setTeamV3Data(data.members);
            setLoadingV3(false);
            return;
          }
        }
      } catch (e) {
        // API不存在时降级到mock
      }
      // 使用 mock 数据
      const mockData = generateMockTeamV3Profiles(Math.max(teamProfiles.length, 5));
      setTeamV3Data(mockData);
      setLoadingV3(false);
    };
    loadV3Data();
  }, [params.teamId, teamProfiles.length]);

  useEffect(() => {
    if (team?.team_name) {
      document.title = `${team.team_name} - 团队看板 - Foxity`;
    }
    return () => {
      document.title = "Foxity";
    };
  }, [team?.team_name]);

  const completedCount = teamV3Data.length;

  const inviteLink = `${mounted ? window.location.origin : ""}/team/${params.teamId}/join`;

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

  // 显示用的成员数据（真名/匿名）
  const displayMembers = useMemo(() => {
    return teamV3Data.map((m, idx) => ({
      ...m,
      displayName: showRealNames ? m.user_name : `成员${idx + 1}`,
    }));
  }, [teamV3Data, showRealNames]);

  // 12型分布数据
  const typeDistribution = useMemo(() => {
    const counts: Record<string, { name: string; count: number; icon: string; orientation: string; pattern: string }> = {};
    for (const m of teamV3Data) {
      const type = m.v3.twelve_type.primary_type;
      if (!counts[type]) {
        counts[type] = {
          name: type,
          count: 0,
          icon: m.v3.twelve_type.primary_icon,
          orientation: m.v3.twelve_type.skill_orientation,
          pattern: m.v3.twelve_type.behavior_pattern,
        };
      }
      counts[type].count++;
    }
    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [teamV3Data]);

  // 饼图颜色
  const PIE_COLORS = [
    "#FF9F4D", "#7ec4a8", "#818cf8", "#f472b6", "#facc15",
    "#38bdf8", "#fb923c", "#4ade80", "#a78bfa", "#f87171",
  ];

  // 能力热力图数据（6个硬技能 × N个成员）
  const heatmapData = useMemo(() => {
    return displayMembers.map((m) => ({
      name: m.displayName,
      user_id: m.user_id,
      scores: HARD_SKILL_DIMENSIONS.reduce((acc, dim) => {
        acc[dim] = m.v3.hard_skills[dim]?.verified_score || 0;
        return acc;
      }, {} as Record<string, number>),
    }));
  }, [displayMembers]);

  // 团队平均能力分
  const teamAvgScores = useMemo(() => {
    const avg: Record<string, number> = {};
    for (const dim of HARD_SKILL_DIMENSIONS) {
      const total = teamV3Data.reduce((sum, m) => sum + (m.v3.hard_skills[dim]?.verified_score || 0), 0);
      avg[dim] = teamV3Data.length > 0 ? total / teamV3Data.length : 0;
    }
    return avg;
  }, [teamV3Data]);

  // 团队短板（得分最低的2个维度）
  const teamWeakest = useMemo(() => {
    return Object.entries(teamAvgScores)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 2)
      .map(([dim, score]) => ({
        dimension: dim as HardSkillDimension,
        label: DIMENSION_LABELS[dim as HardSkillDimension],
        score,
      }));
  }, [teamAvgScores]);

  // 可信度梯队
  const credibilityTiers = useMemo(() => {
    const tiers: Record<CredibilityLevel, typeof displayMembers> = {
      S: [],
      A: [],
      B: [],
      C: [],
      D: [],
      unrated: [],
    };
    for (const m of displayMembers) {
      const level = m.v3.credibility.overall_level;
      tiers[level].push(m);
    }
    return tiers;
  }, [displayMembers]);

  // 能力热力图单元格颜色
  const getHeatColor = (score: number) => {
    if (score >= 8) return "bg-fox-orange text-white";
    if (score >= 6.5) return "bg-fox-orange/70 text-white";
    if (score >= 5) return "bg-fox-yellow/80 text-fox-navy";
    if (score >= 3.5) return "bg-fox-yellow/40 text-fox-navy";
    if (score > 0) return "bg-fox-gray-bg text-fox-gray";
    return "bg-gray-100 text-gray-400";
  };

  return (
    <main className="min-h-screen bg-fox-cream/30 pb-12">
      {/* 顶部导航 */}
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

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        {/* 团队信息头部 */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-fox-navy md:text-3xl">{team.team_name}</h1>
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
                  <span className="text-sm text-fox-gray">/ {Math.max(teamProfiles.length, teamV3Data.length)} 人已完成</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-fox-gray-bg">
                  <div
                    className="h-full rounded-full bg-fox-orange transition-all duration-500"
                    style={{
                      width: `${teamProfiles.length > 0 ? (completedCount / teamProfiles.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 邀请链接 */}
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

        {/* 主要内容 Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-4">
            <TabsTrigger value="overview">总览</TabsTrigger>
            <TabsTrigger value="heatmap">能力热力图</TabsTrigger>
            <TabsTrigger value="types">角色分布</TabsTrigger>
            <TabsTrigger value="credibility">可信度</TabsTrigger>
          </TabsList>

          {/* 总览 Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* 团队能力概览 + 短板预警 */}
            <div className="grid gap-6 md:grid-cols-3">
              {/* 综合能力分 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">综合能力</CardTitle>
                  <CardDescription>团队平均验证分</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-fox-orange/10">
                      <span className="text-3xl font-bold text-fox-orange">
                        {(Object.values(teamAvgScores).reduce((a, b) => a + b, 0) / HARD_SKILL_DIMENSIONS.length).toFixed(1)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-fox-gray">团队平均分</p>
                      <p className="mt-1 text-xs text-fox-gray">满分 10 分</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 可信度平均 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">平均可信度</CardTitle>
                  <CardDescription>团队成员自评准确度</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
                      <span className="text-3xl font-bold text-emerald-600">
                        {(() => {
                          const rated = teamV3Data.filter((m) => m.v3.credibility.overall !== null);
                          if (rated.length === 0) return "-";
                          const avg = rated.reduce((s, m) => s + (m.v3.credibility.overall || 0), 0) / rated.length;
                          return (avg * 100).toFixed(0) + "%";
                        })()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-fox-gray">验证/自述比</p>
                      <p className="mt-1 text-xs text-fox-gray">越高越诚实</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 角色多样性 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">角色多样性</CardTitle>
                  <CardDescription>12型角色覆盖数</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-violet-50">
                      <span className="text-3xl font-bold text-violet-600">
                        {typeDistribution.length}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-fox-gray">种不同角色</p>
                      <p className="mt-1 text-xs text-fox-gray">共12种类型</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 团队短板预警 */}
            <Card className="border-fox-coral/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-5 w-5 text-fox-coral" />
                  团队能力缺口预警
                </CardTitle>
                <CardDescription>以下维度团队整体偏弱，建议重点关注</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {teamWeakest.map((item, idx) => (
                  <div
                    key={item.dimension}
                    className="flex items-start gap-3 rounded-xl border border-fox-gray-light bg-white p-4"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-fox-orange/20 text-fox-orange">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-fox-navy">{item.label}偏弱</h4>
                        <Badge variant="outline" className="border-fox-coral text-fox-coral">
                          团队平均 {item.score.toFixed(1)} 分
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-fox-gray">
                        团队在{item.label}方面整体得分较低，可能影响项目质量。建议：
                        {idx === 0 ? "补充相关背景成员，或安排专项培训提升。" : "在任务分配时考虑借助外部资源或工具弥补。"}
                      </p>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-fox-gray-bg">
                        <div
                          className="h-full rounded-full bg-fox-coral"
                          style={{ width: `${item.score * 10}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 成员卡片列表（快速预览） */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-fox-navy">成员一览</h2>
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
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {displayMembers.map((member, idx) => {
                  const typeKey = `${member.v3.twelve_type.skill_orientation}-${member.v3.twelve_type.behavior_pattern}`;
                  const typeColor = TYPE_COLORS[typeKey] || TYPE_COLORS["analytical-collaborative"];
                  const credColor = CREDIBILITY_COLORS[member.v3.credibility.overall_level];
                  const overallScore = Object.values(member.v3.hard_skills).reduce((s, d) => s + d.verified_score, 0) / HARD_SKILL_DIMENSIONS.length;

                  return (
                    <Card
                      key={member.user_id}
                      className="cursor-pointer transition-all hover:shadow-md"
                      onClick={() => router.push(`/team/${params.teamId}/member/${member.user_id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-fox-cream text-lg font-bold text-fox-orange">
                            {member.displayName[0]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate font-semibold text-fox-navy">
                              {member.displayName}
                            </h3>
                            <div className="mt-0.5 flex items-center gap-1">
                              <span className="text-sm">{member.v3.twelve_type.primary_icon}</span>
                              <span className="truncate text-xs text-fox-gray">
                                {member.v3.twelve_type.primary_type}
                              </span>
                            </div>
                          </div>
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${credColor.bg} ${credColor.text} text-xs font-bold shadow-md`}>
                            {member.v3.credibility.overall_level}
                          </div>
                        </div>

                        {/* 综合分 + 能力迷你条 */}
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-xs text-fox-gray">综合验证分</span>
                          <span className="text-sm font-bold text-fox-orange">{overallScore.toFixed(1)}</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-fox-gray-bg">
                          <div
                            className="h-full rounded-full bg-fox-orange"
                            style={{ width: `${overallScore * 10}%` }}
                          />
                        </div>

                        {/* 5个小能力点 */}
                        <div className="mt-3 grid grid-cols-5 gap-1">
                          {HARD_SKILL_DIMENSIONS.map((dim) => {
                            const score = member.v3.hard_skills[dim]?.verified_score || 0;
                            return (
                              <div
                                key={dim}
                                className={`h-6 rounded text-center text-xs font-bold leading-6 ${getHeatColor(score)}`}
                                title={`${DIMENSION_LABELS[dim]}: ${score.toFixed(1)}`}
                              >
                                {score > 0 ? Math.round(score) : "-"}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* 能力热力图 Tab */}
          <TabsContent value="heatmap" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-fox-navy">能力热力图</h2>
                <p className="text-sm text-fox-gray">颜色越深代表能力越强，一眼看出团队长短板</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRealNames(!showRealNames)}
                className="text-fox-gray"
              >
                {showRealNames ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                {showRealNames ? "匿名" : "真名"}
              </Button>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px] text-sm">
                    <thead>
                      <tr>
                        <th className="pb-3 text-left font-medium text-fox-gray">成员</th>
                        {HARD_SKILL_DIMENSIONS.map((dim) => (
                          <th key={dim} className="pb-3 text-center font-medium text-fox-gray">
                            {DIMENSION_LABELS[dim]}
                          </th>
                        ))}
                        <th className="pb-3 text-center font-medium text-fox-gray">综合</th>
                      </tr>
                    </thead>
                    <tbody>
                      {heatmapData.map((row) => {
                        const avg = Object.values(row.scores).reduce((a, b) => a + b, 0) / HARD_SKILL_DIMENSIONS.length;
                        return (
                          <tr
                            key={row.user_id}
                            className="cursor-pointer border-t border-fox-gray-light hover:bg-fox-cream/30"
                            onClick={() => router.push(`/team/${params.teamId}/member/${row.user_id}`)}
                          >
                            <td className="py-2 pr-4">
                              <span className="font-medium text-fox-navy">{row.name}</span>
                            </td>
                            {HARD_SKILL_DIMENSIONS.map((dim) => {
                              const score = row.scores[dim] || 0;
                              return (
                                <td key={dim} className="py-2 text-center">
                                  <div
                                    className={`mx-auto h-8 w-12 rounded font-bold leading-8 ${getHeatColor(score)}`}
                                  >
                                    {score > 0 ? score.toFixed(1) : "-"}
                                  </div>
                                </td>
                              );
                            })}
                            <td className="py-2 text-center">
                              <div className={`mx-auto h-8 w-12 rounded font-bold leading-8 ${getHeatColor(avg)}`}>
                                {avg.toFixed(1)}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {/* 团队平均行 */}
                      <tr className="border-t-2 border-fox-orange/30 bg-fox-orange/5">
                        <td className="py-3 pr-4">
                          <span className="font-bold text-fox-navy">团队平均</span>
                        </td>
                        {HARD_SKILL_DIMENSIONS.map((dim) => {
                          const score = teamAvgScores[dim] || 0;
                          return (
                            <td key={dim} className="py-3 text-center">
                              <div
                                className={`mx-auto h-8 w-12 rounded font-bold leading-8 ${getHeatColor(score)}`}
                              >
                                {score.toFixed(1)}
                              </div>
                            </td>
                          );
                        })}
                        <td className="py-3 text-center">
                          <div className="mx-auto h-8 w-12 rounded bg-fox-orange font-bold leading-8 text-white">
                            {(Object.values(teamAvgScores).reduce((a, b) => a + b, 0) / HARD_SKILL_DIMENSIONS.length).toFixed(1)}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 图例 */}
                <div className="mt-4 flex items-center justify-center gap-3 text-xs text-fox-gray">
                  <span>低</span>
                  {["bg-gray-100", "bg-fox-yellow/40", "bg-fox-yellow/80", "bg-fox-orange/70", "bg-fox-orange"].map((c, i) => (
                    <div key={i} className={`h-4 w-8 rounded ${c}`} />
                  ))}
                  <span>高</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 角色分布 Tab */}
          <TabsContent value="types" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* 饼图 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <PieChart className="h-5 w-5 text-violet-500" />
                    角色类型分布
                  </CardTitle>
                  <CardDescription>团队12型角色占比</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={typeDistribution.map((t, i) => ({ ...t, fill: PIE_COLORS[i % PIE_COLORS.length] }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="count"
                          nameKey="name"
                          label={({ name, percent, ...rest }: any) => {
  const icon = (rest as any).payload?.icon || "";
  return `${icon} ${name} ${((percent || 0) * 100).toFixed(0)}%`;
}}
                          labelLine={false}
                        >
                          {typeDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, _name, props: any) => [
                            `${value}人 · ${props?.payload?.icon || ''} ${props?.payload?.name || ''}`,
                            "人数",
                          ]}
                          contentStyle={{ borderRadius: "8px", border: "1px solid #e5e5e5" }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* 条形图 + 详细列表 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-5 w-5 text-fox-orange" />
                    类型人数排行
                  </CardTitle>
                  <CardDescription>按类型统计的成员数量</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={typeDistribution}
                        layout="vertical"
                        margin={{ left: 20, right: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={80}
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value, index) => `${typeDistribution[index]?.icon} ${value}`}
                        />
                        <Tooltip
                          formatter={(value) => [`${value}人`, "人数"]}
                          contentStyle={{ borderRadius: "8px", border: "1px solid #e5e5e5" }}
                        />
                        <Bar dataKey="count" fill="#FF9F4D" radius={[0, 4, 4, 0]} />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 团队角色构成分析 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">团队角色构成分析</CardTitle>
                <CardDescription>基于技能取向和行为模式的团队结构</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {/* 技能取向分布 */}
                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-fox-navy">技能取向</h4>
                    <div className="space-y-2">
                      {(() => {
                        const orients: Record<string, number> = { analytical: 0, execution: 0, business: 0 };
                        const orientLabels: Record<string, string> = { analytical: "📊 分析型", execution: "⚙️ 执行型", business: "💰 商业型" };
                        for (const m of teamV3Data) {
                          orients[m.v3.twelve_type.skill_orientation]++;
                        }
                        return Object.entries(orients).map(([key, count]) => (
                          <div key={key}>
                            <div className="mb-1 flex justify-between text-sm">
                              <span className="text-fox-navy">{orientLabels[key]}</span>
                              <span className="text-fox-gray">{count}人</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-fox-gray-bg">
                              <div
                                className="h-full rounded-full bg-fox-orange"
                                style={{ width: `${teamV3Data.length > 0 ? (count / teamV3Data.length) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* 行为模式分布 */}
                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-fox-navy">行为模式</h4>
                    <div className="space-y-2">
                      {(() => {
                        const patterns: Record<string, number> = { dominant: 0, collaborative: 0, independent: 0, growing: 0 };
                        const patternLabels: Record<string, string> = {
                          dominant: "👑 主导型",
                          collaborative: "🤝 协作型",
                          independent: "🔍 独立型",
                          growing: "🌱 成长型",
                        };
                        for (const m of teamV3Data) {
                          patterns[m.v3.twelve_type.behavior_pattern]++;
                        }
                        return Object.entries(patterns).map(([key, count]) => (
                          <div key={key}>
                            <div className="mb-1 flex justify-between text-sm">
                              <span className="text-fox-navy">{patternLabels[key]}</span>
                              <span className="text-fox-gray">{count}人</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-fox-gray-bg">
                              <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{ width: `${teamV3Data.length > 0 ? (count / teamV3Data.length) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* 结构建议 */}
                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-fox-navy">结构建议</h4>
                    <div className="space-y-2">
                      {(() => {
                        const tips: string[] = [];
                        const orients: Record<string, number> = { analytical: 0, execution: 0, business: 0 };
                        const patterns: Record<string, number> = { dominant: 0, collaborative: 0, independent: 0, growing: 0 };
                        for (const m of teamV3Data) {
                          orients[m.v3.twelve_type.skill_orientation]++;
                          patterns[m.v3.twelve_type.behavior_pattern]++;
                        }
                        if (patterns.dominant === 0) {
                          tips.push("⚠️ 缺少主导型角色，可能存在决策效率问题");
                        }
                        if (orients.execution === 0) {
                          tips.push("⚠️ 缺少执行型人才，技术/设计实现可能薄弱");
                        }
                        if (orients.business === 0) {
                          tips.push("⚠️ 缺少商业型人才，财务/资源能力可能不足");
                        }
                        if (patterns.growing > teamV3Data.length * 0.5) {
                          tips.push("💡 成长型成员较多，需要资深成员带教");
                        }
                        if (tips.length === 0) {
                          tips.push("✅ 团队结构均衡，角色搭配合理");
                        }
                        return tips;
                      })().map((tip, idx) => (
                        <p key={idx} className="text-sm text-fox-navy/80">
                          {tip}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 可信度 Tab */}
          <TabsContent value="credibility" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-5">
              {(["S", "A", "B", "C", "D"] as CredibilityLevel[]).map((level) => {
                const members = credibilityTiers[level];
                const config = CREDIBILITY_COLORS[level];
                return (
                  <Card key={level}>
                    <CardContent className="p-4 text-center">
                      <div
                        className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${config.bg} ${config.text} text-xl font-bold shadow-lg`}
                      >
                        {level}
                      </div>
                      <p className="mt-2 text-sm font-semibold text-fox-navy">
                        {config.label.split("·")[1]?.trim() || level}
                      </p>
                      <p className="mt-1 text-2xl font-bold text-fox-navy">{members.length}</p>
                      <p className="text-xs text-fox-gray">人</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* 可信度梯队列表 */}
            <div className="space-y-4">
              {(["S", "A", "B", "C", "D"] as CredibilityLevel[]).map((level) => {
                const members = credibilityTiers[level];
                const config = CREDIBILITY_COLORS[level];
                if (members.length === 0) return null;
                const isWarning = level === "C" || level === "D";

                return (
                  <Card key={level}>
                    <CardHeader className={`pb-3 ${isWarning ? "bg-fox-coral/5" : ""}`}>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-full ${config.bg} ${config.text} text-sm font-bold`}>
                          {level}
                        </div>
                        {config.label}
                        {isWarning && members.length > 0 && (
                          <Badge variant="outline" className="ml-2 border-fox-coral text-fox-coral">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            需关注
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {level === "S" && "实际能力超出自评，可放心加码任务难度"}
                        {level === "A" && "自评准确，可信度高，可按能力分配任务"}
                        {level === "B" && "正常范围，多数人在此区间，分配任务正常即可"}
                        {level === "C" && "自评偏乐观，关键任务需验证，建议先从小任务观察"}
                        {level === "D" && "能力存疑，核心角色勿分配，需重点观察"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {members.map((m) => {
                          const overall = Object.values(m.v3.hard_skills).reduce((s, d) => s + d.verified_score, 0) / HARD_SKILL_DIMENSIONS.length;
                          return (
                            <div
                              key={m.user_id}
                              className="flex cursor-pointer items-center gap-3 rounded-lg border border-fox-gray-light p-3 hover:bg-fox-cream/30 transition-colors"
                              onClick={() => router.push(`/team/${params.teamId}/member/${m.user_id}`)}
                            >
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-fox-cream font-bold text-fox-orange">
                                {m.displayName[0]}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium text-fox-navy">{m.displayName}</p>
                                <p className="text-xs text-fox-gray">
                                  {m.v3.twelve_type.primary_icon} {m.v3.twelve_type.primary_type}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-fox-orange">{overall.toFixed(1)}</p>
                                <p className="text-xs text-fox-gray">验证分</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
