"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Share2, Download, Sparkles, TrendingUp, Star,
  BookOpen, Target, Zap, Heart, Loader2, ChevronRight,
} from "lucide-react";
import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/store/useStore";
import { useAuth } from "@/lib/auth";
import { exportProfileToPDF } from "@/lib/export-pdf";
import type { UserProfile, HardSkillKey, SoftSkillKey } from "@/types";
import { hardSkillLabels } from "@/types";
import { generateMockV3Profile, getWarmLevel, TYPE_COLORS, SOFT_SKILL_NARRATIVES } from "@/lib/v3/mock";
import type { V3Profile, HardSkillDimension, SoftSkillDimension } from "@/lib/scoring/types";
import { DIMENSION_LABELS } from "@/lib/scoring/types";

// 软实力维度图标配置（队员侧展示4个核心维度）
const SOFT_SKILL_DISPLAY: { key: SoftSkillDimension; icon: typeof Heart; color: string }[] = [
  { key: "communication", icon: Heart, color: "text-rose-500" },
  { key: "work_style", icon: BookOpen, color: "text-blue-500" },
  { key: "leadership", icon: Target, color: "text-amber-500" },
  { key: "learning", icon: Zap, color: "text-emerald-500" },
];

// 成长建议优先级样式
const priorityStyle: Record<string, { bg: string; dot: string; text: string; label: string }> = {
  low: { bg: "bg-green-100", dot: "bg-green-500", text: "text-green-700", label: "低" },
  medium: { bg: "bg-yellow-100", dot: "bg-yellow-500", text: "text-yellow-700", label: "中" },
  high: { bg: "bg-red-100", dot: "bg-red-500", text: "text-red-700", label: "高" },
};

export default function ProfilePage() {
  const params = useParams<{ teamId: string }>();
  const router = useRouter();
  const { user } = useAuth(false);
  const currentProfile = useStore((state) => state.currentProfile);
  const mockProfile = useStore((state) => state.mockProfile);
  const currentTeam = useStore((state) => state.currentTeam);
  const [teamName, setTeamName] = useState<string>("团队测评");
  const [dbProfile, setDbProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [exporting, setExporting] = useState(false);

  // 从数据库加载用户画像
  useEffect(() => {
    if (!user?.user_id) {
      setLoadingProfile(false);
      return;
    }
    fetch(`/api/profiles/${user.user_id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((result) => {
        if (result?.data) {
          setDbProfile(result.data as UserProfile);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, [user?.user_id]);

  // 加载当前团队名称
  useEffect(() => {
    if (currentTeam?.team_id === params.teamId) {
      setTeamName(currentTeam.team_name);
    } else {
      fetch(`/api/teams/${params.teamId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((team) => {
          if (team?.team_name) setTeamName(team.team_name);
        })
        .catch(() => {});
    }
  }, [params.teamId, currentTeam]);

  // V3 画像数据（优先从 profile 读取 v3 字段，否则用 mock）
  const v3Data: V3Profile = useMemo(() => {
    const rawData = currentProfile ?? dbProfile ?? mockProfile;
    // 如果后端返回了 v3 数据就用，否则生成 mock
    if ((rawData as any)?.v3Score) {
      return (rawData as any).v3Score as V3Profile;
    }
    return generateMockV3Profile(rawData);
  }, [currentProfile, dbProfile, mockProfile]);

  // 用户显示名
  const displayName = user?.name || currentProfile?.user_name || dbProfile?.user_name || mockProfile.user_name;

  // 雷达图数据（硬技能验证分）
  const radarData = useMemo(() => {
    return Object.entries(v3Data.hard_skills).map(([key, val]) => ({
      ability: key,
      label: DIMENSION_LABELS[key as HardSkillDimension],
      score: val.verified_score,
      fullMark: 10,
    }));
  }, [v3Data]);

  // 12型卡片配色
  const typeColor = useMemo(() => {
    const key = `${v3Data.twelve_type.skill_orientation}-${v3Data.twelve_type.behavior_pattern}`;
    return TYPE_COLORS[key] || TYPE_COLORS["analytical-collaborative"];
  }, [v3Data]);

  // 按优先级排序的成长建议
  const sortedGrowth = useMemo(() => {
    return [...v3Data.areas_for_growth].sort((a, b) => {
      const order: Record<string, number> = { 高: 0, 中: 1, 低: 2 };
      return order[a.priority] - order[b.priority];
    });
  }, [v3Data]);

  // 关键词标签按类别分组
  const tagsByCategory = useMemo(() => {
    const groups: Record<string, typeof v3Data.keyword_tags> = {};
    for (const tag of v3Data.keyword_tags) {
      const cat = tag.category || "其他";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(tag);
    }
    return groups;
  }, [v3Data]);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const container = document.getElementById("export-container");
      if (!container) return;
      const sections: HTMLElement[] = [];
      const sectionEls = container.querySelectorAll<HTMLElement>("[data-export-section]");
      sectionEls.forEach((el) => sections.push(el));
      await exportProfileToPDF(sections, {
        userName: displayName,
        teamName,
      });
    } catch (e) {
      console.error("Export PDF error:", e);
    } finally {
      setExporting(false);
    }
  };

  const showLoading = !currentProfile && loadingProfile;

  if (showLoading) {
    return (
      <main className="min-h-screen bg-fox-cream/30">
        <header className="border-b border-fox-gray-light bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-6">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回
            </Button>
          </div>
        </header>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-fox-navy" />
            <p className="text-sm text-fox-gray">加载画像数据...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-fox-cream/30 pb-12">
      {/* 顶部导航 */}
      <header className="border-b border-fox-gray-light bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              分享
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
              {exporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  导出中...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  导出
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        {/* 用户信息头部 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col items-center text-center md:flex-row md:items-end md:gap-6 md:text-left"
        >
          <div className="relative">
            <img src="/fox.png" alt={displayName} width={100} height={100} className="rounded-2xl shadow-md" />
          </div>
          <div className="mt-4 md:mt-0 md:pb-2">
            <h1 className="text-2xl font-bold text-fox-navy md:text-3xl">{displayName}</h1>
            <p className="mt-1 text-sm text-fox-gray">{teamName}</p>
            <p className="mt-2 max-w-md text-sm text-fox-navy/80">{v3Data.summary}</p>
          </div>
        </motion.div>

        {/* 12型角色大卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div
            className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${typeColor.from} ${typeColor.to} p-8 text-white shadow-xl`}
          >
            {/* 装饰圆 */}
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
            <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-white/10" />

            <div className="relative flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 text-5xl backdrop-blur-sm">
                  {v3Data.twelve_type.primary_icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">你的角色类型</p>
                  <h2 className="text-2xl font-bold md:text-3xl">
                    {v3Data.twelve_type.primary_type}
                  </h2>
                  <div className="mt-1 flex items-center gap-1">
                    {Array.from({ length: Math.round(v3Data.twelve_type.confidence * 5) }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-white/80 text-white/80" />
                    ))}
                    <span className="ml-1 text-xs text-white/70">
                      {Math.round(v3Data.twelve_type.confidence * 100)}% 匹配
                    </span>
                  </div>
                </div>
              </div>
              <div className="max-w-md">
                <p className="text-sm leading-relaxed text-white/90">
                  {v3Data.twelve_type.primary_description}
                </p>
              </div>
            </div>

            {/* 核心特质关键词 */}
            <div className="relative mt-6 flex flex-wrap gap-2">
              {v3Data.keyword_tags.filter(t => t.confidence === "high").slice(0, 4).map((tag, idx) => (
                <span
                  key={idx}
                  className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium backdrop-blur-sm"
                >
                  {tag.tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 亮点 */}
        {v3Data.highlights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-8"
          >
            <Card className="border-fox-orange/20 bg-gradient-to-br from-fox-orange/5 to-transparent">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-fox-orange" />
                  你的亮点
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {v3Data.highlights.map((h, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.25 + idx * 0.05 }}
                    className="flex gap-3 text-sm text-fox-navy"
                  >
                    <span className="text-fox-orange">✨</span>
                    <span>{h}</span>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 硬技能区域 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="mb-4 text-lg font-bold text-fox-navy">💪 硬技能图谱</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* 雷达图 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">能力雷达图</CardTitle>
                <CardDescription>五大硬技能维度分布</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsRadarChart data={radarData} outerRadius="75%">
                      <PolarGrid stroke="#E5E5E5" />
                      <PolarAngleAxis
                        dataKey="label"
                        tick={{ fill: "#2B4C7E", fontSize: 11, fontWeight: 600 }}
                      />
                      <PolarRadiusAxis angle={90} domain={[0, 10]} tick={false} axisLine={false} />
                      <Radar
                        name="能力等级"
                        dataKey="score"
                        stroke="#FF9F4D"
                        fill="#FF9F4D"
                        fillOpacity={0.35}
                        strokeWidth={2}
                      />
                      <Tooltip
                        formatter={(value) => [`${Number(value).toFixed(1)} 分`, "验证分"]}
                        contentStyle={{ borderRadius: "8px", border: "1px solid #e5e5e5" }}
                      />
                    </RechartsRadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* 等级列表（温暖化展示，不显示精确分数） */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">技能等级</CardTitle>
                <CardDescription>基于对话证据的能力评估</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(v3Data.hard_skills).map(([key, val], idx) => {
                  const warmLevel = getWarmLevel(val.verified_score);
                  const dimLabel = DIMENSION_LABELS[key as HardSkillDimension];
                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.35 + idx * 0.05 }}
                    >
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-sm font-medium text-fox-navy">{dimLabel}</span>
                        <span className="text-sm font-semibold text-fox-orange">{warmLevel.label}</span>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-2 flex-1 rounded-full ${
                              i < warmLevel.stars ? "bg-fox-orange" : "bg-fox-gray-bg"
                            }`}
                          />
                        ))}
                      </div>
                      {val.evidence_count > 0 && (
                        <p className="mt-1 text-xs text-fox-gray">
                          基于 {val.evidence_count} 条对话证据评估
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* 软实力区域（行为锚点 + 故事化描述） */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="mb-4 text-lg font-bold text-fox-navy">🧠 软实力画像</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {SOFT_SKILL_DISPLAY.map(({ key, icon: Icon, color }, idx) => {
              const score = v3Data.soft_skills[key]?.verified_score || 0;
              const signals = v3Data.soft_skills[key]?.evidence_list as any[] || [];
              const narrative = SOFT_SKILL_NARRATIVES[key](score, signals);
              const warmLevel = getWarmLevel(score);
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.45 + idx * 0.08 }}
                >
                  <Card className="h-full border-fox-gray-light/80 hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="mb-3 flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-fox-cream ${color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-fox-navy">
                            {DIMENSION_LABELS[key]}
                          </h3>
                          <p className="text-xs text-fox-gray">{warmLevel.level}</p>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed text-fox-navy/80">
                        {narrative}
                      </p>
                      <div className="mt-4 flex items-center gap-2">
                        <Progress
                          value={score * 10}
                          className="h-1.5"
                        />
                        <span className="text-xs font-medium text-fox-gray min-w-[2rem]">
                          {Math.round(score)}分
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* 关键词标签云 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-fox-orange" />
                能力关键词
              </CardTitle>
              <CardDescription>从对话中提取的已验证技能标签</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(tagsByCategory).map(([category, tags], catIdx) => (
                <div key={category}>
                  <h4 className="mb-2 text-xs font-semibold text-fox-gray">{category}</h4>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, idx) => (
                      <motion.span
                        key={`${catIdx}-${idx}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: 0.55 + catIdx * 0.1 + idx * 0.03 }}
                        whileHover={{ scale: 1.05 }}
                        className="cursor-default rounded-full px-3 py-1.5 text-sm font-medium"
                        style={{
                          backgroundColor:
                            tag.confidence === "high"
                              ? "#f2aa72"
                              : tag.confidence === "medium"
                              ? "#f2aa7280"
                              : "#f2aa7240",
                          color: tag.confidence === "low" ? "#666" : "white",
                        }}
                        title={tag.evidence}
                      >
                        {tag.tag}
                      </motion.span>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* 成长建议区 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <Card className="border-fox-mint/30 bg-gradient-to-br from-fox-mint/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-fox-mint" />
                成长建议
              </CardTitle>
              <CardDescription>基于你的能力分布，给出的个性化提升方向</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sortedGrowth.map((item, idx) => {
                const style = priorityStyle[item.priority.toLowerCase()] || priorityStyle.medium;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.65 + idx * 0.08 }}
                    className="flex gap-4 rounded-xl border border-fox-gray-light bg-white p-4"
                  >
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${style.dot}`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-semibold text-fox-navy">{item.title}</h4>
                        <Badge variant="outline" className={`${style.text} border-current flex-shrink-0`}>
                          优先级：{style.label}
                        </Badge>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-fox-gray">
                        {item.detail}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* 隐藏的导出区域 */}
      <div id="export-container" style={{ position: "absolute", left: "-9999px", top: 0, width: "800px", background: "#ffffff", padding: "24px" }}>
        <div data-export-section>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#2b4c7e", marginBottom: "16px" }}>
            {v3Data.twelve_type.primary_icon} {v3Data.twelve_type.primary_type}
          </h2>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "16px" }}>{v3Data.twelve_type.primary_description}</p>
          <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#2b4c7e", marginBottom: "8px" }}>亮点</h3>
          {v3Data.highlights.map((h, i) => (
            <div key={i} style={{ fontSize: "14px", color: "#2b4c7e", marginBottom: "4px" }}>✨ {h}</div>
          ))}
        </div>
        <div data-export-section style={{ marginTop: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#2b4c7e", marginBottom: "16px" }}>硬技能</h2>
          {Object.entries(v3Data.hard_skills).map(([key, val]) => (
            <div key={key} style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#2b4c7e" }}>
                <span>{DIMENSION_LABELS[key as HardSkillDimension]}</span>
                <span>{getWarmLevel(val.verified_score).level}</span>
              </div>
              <div style={{ height: "8px", backgroundColor: "#f0f0f0", borderRadius: "4px", marginTop: "4px" }}>
                <div style={{ width: `${val.verified_score * 10}%`, height: "100%", backgroundColor: "#FF9F4D", borderRadius: "4px" }} />
              </div>
            </div>
          ))}
        </div>
        <div data-export-section style={{ marginTop: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#2b4c7e", marginBottom: "16px" }}>成长建议</h2>
          {sortedGrowth.map((item, idx) => {
            const colors: Record<string, string> = { 高: "#ef4444", 中: "#eab308", 低: "#22c55e" };
            const color = colors[item.priority] || "#eab308";
            return (
              <div key={idx} style={{ marginBottom: "12px", padding: "12px", border: "1px solid #e5e5e5", borderRadius: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span style={{ fontWeight: "bold", color: "#2b4c7e" }}>{idx + 1}. {item.title}</span>
                  <span style={{ fontSize: "12px", color, border: `1px solid ${color}`, borderRadius: "9999px", padding: "2px 8px" }}>优先级：{item.priority}</span>
                </div>
                <p style={{ fontSize: "13px", color: "#666" }}>{item.detail}</p>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
