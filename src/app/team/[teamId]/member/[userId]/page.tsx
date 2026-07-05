"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, BarChart3, Brain, MessageSquareQuote, Target, ChevronDown,
  Loader2, Activity, AlertTriangle, Shield, TrendingUp, TrendingDown,
  Award, FileText, Users, Zap,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip as TooltipUI,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/store/useStore";
import { mockProfiles } from "@/mock/data";
import { cn } from "@/lib/utils";
import { generateMockV3Profile, CREDIBILITY_COLORS, TYPE_COLORS } from "@/lib/v3/mock";
import type { V3Profile, HardSkillDimension, SoftSkillDimension, EvidenceLevel } from "@/lib/scoring/types";
import { DIMENSION_LABELS, HARD_SKILL_DIMENSIONS, SOFT_SKILL_DIMENSIONS } from "@/lib/scoring/types";

// 证据等级配置
const EVIDENCE_LEVEL_CONFIG: Record<EvidenceLevel, { label: string; color: string; bg: string }> = {
  L0: { label: "未涉及", color: "text-gray-500", bg: "bg-gray-100" },
  L1: { label: "自称", color: "text-gray-500", bg: "bg-gray-100" },
  L2: { label: "描述", color: "text-blue-600", bg: "bg-blue-50" },
  L3: { label: "经历", color: "text-green-600", bg: "bg-green-50" },
  L4: { label: "深度", color: "text-purple-600", bg: "bg-purple-50" },
  L5: { label: "作品", color: "text-amber-600", bg: "bg-amber-50" },
};

export default function MemberSummaryPage() {
  const params = useParams<{ teamId: string; userId: string }>();
  const router = useRouter();
  const profiles = useStore((state) => state.profiles);
  const [loading, setLoading] = useState(true);
  const [v3Data, setV3Data] = useState<V3Profile | null>(null);
  const [expandedDims, setExpandedDims] = useState<Record<string, boolean>>({});
  const [showChatHistory, setShowChatHistory] = useState(false);

  const profile = useMemo(() => {
    const allProfiles = profiles.length > 0 ? profiles : mockProfiles;
    return allProfiles.find((p) => p.user_id === params.userId) ?? allProfiles[0];
  }, [profiles, params.userId]);

  // 加载 V3 数据（优先从API获取，否则用mock）
  useEffect(() => {
    const loadData = async () => {
      try {
        // 尝试从API加载 V3 数据
        const res = await fetch(`/api/profiles/${params.userId}/v3`);
        if (res.ok) {
          const data = await res.json();
          if (data?.v3) {
            setV3Data(data.v3 as V3Profile);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        // API不存在时降级到mock
      }
      // 使用 mock 数据
      const mock = generateMockV3Profile(profile);
      setV3Data(mock);
      setLoading(false);
    };
    loadData();
  }, [params.userId, profile]);

  // 双轨对比图数据
  const comparisonData = useMemo(() => {
    if (!v3Data) return [];
    return HARD_SKILL_DIMENSIONS.map((dim) => {
      const score = v3Data.hard_skills[dim];
      return {
        name: DIMENSION_LABELS[dim],
        验证分: score?.verified_score || 0,
        自述分: score?.self_score || 0,
        差距: (score?.self_score || 0) - (score?.verified_score || 0),
      };
    });
  }, [v3Data]);

  // 12型卡片配色
  const typeColor = useMemo(() => {
    if (!v3Data) return TYPE_COLORS["analytical-collaborative"];
    const key = `${v3Data.twelve_type.skill_orientation}-${v3Data.twelve_type.behavior_pattern}`;
    return TYPE_COLORS[key] || TYPE_COLORS["analytical-collaborative"];
  }, [v3Data]);

  // 可信度配置
  const credConfig = useMemo(() => {
    if (!v3Data) return CREDIBILITY_COLORS.unrated;
    return CREDIBILITY_COLORS[v3Data.credibility.overall_level];
  }, [v3Data]);

  // 切换证据展开
  const toggleDim = (dim: string) => {
    setExpandedDims((prev) => ({ ...prev, [dim]: !prev[dim] }));
  };

  // 分维度可信度排序（吹牛最严重的排前面）
  const sortedDimCredibility = useMemo(() => {
    if (!v3Data) return [];
    return Object.entries(v3Data.credibility.dimensions)
      .filter(([, val]) => val.credibility !== null)
      .sort((a, b) => (a[1].credibility || 0) - (b[1].credibility || 0));
  }, [v3Data]);

  // 硬技能证据（L2及以上）
  const hardSkillEvidence = useMemo(() => {
    if (!v3Data) return {};
    const result: Record<string, typeof v3Data.hard_skills.market_analysis.evidence_list> = {};
    for (const dim of HARD_SKILL_DIMENSIONS) {
      const list = v3Data.hard_skills[dim]?.evidence_list || [];
      // 只展示 L2 及以上的有效证据
      result[dim] = list.filter((e) => e.level !== "L0" && e.level !== "L1");
    }
    return result;
  }, [v3Data]);

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-fox-gray">未找到该成员</p>
      </main>
    );
  }

  return (
    <TooltipProvider>
      <main className="min-h-screen bg-[#fbf7ef] pb-12">
        {/* 顶部导航 */}
        <header className="sticky top-0 z-30 border-b border-fox-gray-light bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-6">
            <Button variant="ghost" size="sm" onClick={() => router.push(`/team/${params.teamId}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回团队看板
            </Button>
          </div>
        </header>

        <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
          {/* 成员头部 */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-fox-cream text-2xl font-bold text-fox-orange shadow-sm">
                {profile.user_name[0]}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-fox-navy md:text-3xl">{profile.user_name}</h1>
                <p className="mt-1 text-sm text-fox-gray">队长视角 · V3 深度分析</p>
              </div>
            </div>
          </motion.div>

          {loading && (
            <div className="mt-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-fox-orange" />
              <p className="text-sm text-fox-gray">正在加载 V3 分析数据...</p>
            </div>
          )}

          {!loading && v3Data && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mt-8 space-y-6"
            >
              {/* 顶部：12型标签 + 可信度徽章 */}
              <div className="grid gap-6 md:grid-cols-3">
                {/* 12型角色卡片 */}
                <div className="md:col-span-2">
                  <div
                    className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${typeColor.from} ${typeColor.to} p-6 text-white shadow-lg`}
                  >
                    <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
                    <div className="relative flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/20 text-4xl backdrop-blur-sm">
                        {v3Data.twelve_type.primary_icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/80">角色类型</p>
                        <h2 className="text-xl font-bold">{v3Data.twelve_type.primary_type}</h2>
                        <p className="mt-0.5 text-xs text-white/70">
                          置信度 {Math.round(v3Data.twelve_type.confidence * 100)}%
                        </p>
                      </div>
                    </div>
                    <p className="relative mt-4 text-sm leading-relaxed text-white/90">
                      {v3Data.twelve_type.primary_description}
                    </p>
                  </div>
                </div>

                {/* 可信度徽章 */}
                <Card className="border-2 overflow-hidden">
                  <div className={`${credConfig.bg} px-6 py-4 text-center`}>
                    <div className="flex items-center justify-center gap-2">
                      <Shield className={`h-5 w-5 ${credConfig.text}`} />
                      <span className={`text-lg font-bold ${credConfig.text}`}>可信度</span>
                    </div>
                    <div className={`mt-2 text-4xl font-black ${credConfig.text}`}>
                      {v3Data.credibility.overall_level}
                    </div>
                    <p className={`mt-1 text-sm ${credConfig.text} opacity-90`}>
                      {v3Data.credibility.overall_label}
                    </p>
                    {v3Data.credibility.overall !== null && (
                      <p className={`mt-1 text-xs ${credConfig.text} opacity-70`}>
                        验证分 / 自述分 = {(v3Data.credibility.overall * 100).toFixed(0)}%
                      </p>
                    )}
                  </div>
                  <CardContent className="p-4 pt-3">
                    <TooltipUI>
                      <TooltipTrigger asChild>
                        <div className="flex cursor-help items-center gap-1.5 text-xs text-fox-gray">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          什么是可信度？
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">
                          可信度 = 验证分 ÷ 自述分
                          <br />
                          反映成员自评与实际能力的差距
                          <br />
                          S级：实际能力 &gt; 自评（低调）
                          <br />
                          D级：自评远高于实际（注水）
                        </p>
                      </TooltipContent>
                    </TooltipUI>
                  </CardContent>
                </Card>
              </div>

              {/* 双轨对比区 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-fox-orange" />
                    验证分 vs 自述分对比
                  </CardTitle>
                  <CardDescription>一眼看出哪些维度自评偏高</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" domain={[0, 10]} />
                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{ borderRadius: "8px", border: "1px solid #e5e5e5" }}
                        />
                        <Legend />
                        <Bar dataKey="验证分" fill="#FF9F4D" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="自述分" fill="#94A3B8" radius={[0, 4, 4, 0]} fillOpacity={0.6} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* 可信度详情 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-fox-coral" />
                    分维度可信度分析
                  </CardTitle>
                  <CardDescription>各维度的自评偏差程度</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sortedDimCredibility.map(([dim, val], idx) => {
                    const dimLabel = DIMENSION_LABELS[dim as keyof typeof DIMENSION_LABELS] || dim;
                    const credColor = CREDIBILITY_COLORS[val.level];
                    const diff = val.self_score - val.verified_score;
                    const isInflated = diff > 1.5;
                    return (
                      <motion.div
                        key={dim}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="rounded-xl border border-fox-gray-light bg-white p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-fox-navy">{dimLabel}</span>
                            <Badge className={`${credColor.bg} ${credColor.text} border-0`}>
                              {val.level}级
                            </Badge>
                            {isInflated && (
                              <Badge variant="outline" className="border-fox-coral text-fox-coral">
                                <TrendingUp className="mr-1 h-3 w-3" />
                                自评偏高
                              </Badge>
                            )}
                            {diff < -0.5 && (
                              <Badge variant="outline" className="border-emerald-500 text-emerald-600">
                                <TrendingDown className="mr-1 h-3 w-3" />
                                低调实力派
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-fox-navy">
                              <span className="font-bold text-fox-orange">{val.verified_score.toFixed(1)}</span>
                              <span className="mx-1 text-fox-gray">/</span>
                              <span className="text-fox-gray">{val.self_score.toFixed(1)}</span>
                            </p>
                            <p className="text-xs text-fox-gray">
                              验证分 / 自述分
                            </p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="relative h-2 overflow-hidden rounded-full bg-fox-gray-bg">
                            {/* 自述分背景条 */}
                            <div
                              className="absolute inset-y-0 left-0 bg-slate-300/50"
                              style={{ width: `${val.self_score * 10}%` }}
                            />
                            {/* 验证分前景条 */}
                            <div
                              className={`absolute inset-y-0 left-0 ${credColor.bg}`}
                              style={{ width: `${val.verified_score * 10}%` }}
                            />
                          </div>
                        </div>
                        {isInflated && (
                          <p className="mt-2 text-xs text-fox-coral">
                            ⚠️ {dimLabel}自评约{val.self_score.toFixed(1)}分，实际证据支撑约{val.verified_score.toFixed(1)}分，差距{diff.toFixed(1)}分
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* 证据墙 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquareQuote className="h-5 w-5 text-fox-navy" />
                    证据墙
                  </CardTitle>
                  <CardDescription>按维度分组的所有有效证据（L2及以上）</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {HARD_SKILL_DIMENSIONS.map((dim) => {
                    const evidences = hardSkillEvidence[dim] || [];
                    const dimLabel = DIMENSION_LABELS[dim];
                    const isExpanded = expandedDims[dim] ?? false;
                    const highestLevel = v3Data.hard_skills[dim]?.evidence_level || "L0";
                    const levelConfig = EVIDENCE_LEVEL_CONFIG[highestLevel];

                    return (
                      <div key={dim} className="rounded-xl border border-fox-gray-light bg-white overflow-hidden">
                        <button
                          className="flex w-full items-center justify-between p-4 text-left hover:bg-fox-cream/30 transition-colors"
                          onClick={() => toggleDim(dim)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-fox-navy">{dimLabel}</span>
                            <Badge variant="outline" className={`${levelConfig.color} ${levelConfig.bg} border-current`}>
                              最高{levelConfig.label}
                            </Badge>
                            <span className="text-xs text-fox-gray">
                              {evidences.length} 条证据
                            </span>
                          </div>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 text-fox-gray transition-transform",
                              isExpanded && "rotate-180"
                            )}
                          />
                        </button>
                        {isExpanded && evidences.length > 0 && (
                          <div className="border-t border-fox-gray-light bg-fox-cream/20 p-4 space-y-3">
                            {evidences.map((ev, evIdx) => {
                              const evConfig = EVIDENCE_LEVEL_CONFIG[ev.level];
                              return (
                                <div
                                  key={evIdx}
                                  className="rounded-lg border border-fox-gray-light bg-white p-3"
                                >
                                  <div className="mb-2 flex items-center justify-between">
                                    <Badge className={`${evConfig.bg} ${evConfig.color} border-0 text-xs`}>
                                      {ev.level} {evConfig.label}
                                    </Badge>
                                    <span className="text-xs text-fox-gray">
                                      第 {ev.chat_round} 轮
                                    </span>
                                  </div>
                                  <p className="text-sm font-medium text-fox-navy">{ev.summary}</p>
                                  <div className="mt-2 rounded-md bg-fox-cream/50 p-2">
                                    <p className="text-xs italic text-fox-navy/80">
                                      「{ev.quote}」
                                    </p>
                                  </div>
                                  <p className="mt-1 text-xs text-fox-gray">
                                    质量分: {ev.quality_score}/10
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {isExpanded && evidences.length === 0 && (
                          <div className="border-t border-fox-gray-light p-4">
                            <p className="text-center text-sm text-fox-gray">暂无有效证据</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* 软实力行为分析 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-fox-mint" />
                    软实力行为分析
                  </CardTitle>
                  <CardDescription>基于说话方式的行为锚点分析</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {["communication", "work_style", "leadership", "learning"].map((dim, idx) => {
                    const dimKey = dim as SoftSkillDimension;
                    const score = v3Data.soft_skills[dimKey]?.verified_score || 0;
                    const signalCount = v3Data.soft_skills[dimKey]?.behavior_signal_count || 0;
                    const dimLabel = DIMENSION_LABELS[dimKey];
                    return (
                      <motion.div
                        key={dim}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="rounded-xl border border-fox-gray-light bg-white p-4"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <h4 className="font-semibold text-fox-navy">{dimLabel}</h4>
                          <span className="text-sm font-bold text-fox-mint">{score.toFixed(1)}</span>
                        </div>
                        <Progress value={score * 10} className="h-1.5" />
                        <p className="mt-3 text-xs text-fox-gray">
                          基于 {signalCount} 个行为信号分析
                        </p>
                        {/* 行为信号摘录 */}
                        {dim === "leadership" && (
                          <div className="mt-3 rounded-md bg-fox-cream/30 p-2">
                            <p className="text-xs text-fox-navy/80">
                              💡 <span className="font-medium">决策语气：</span>
                              在讨论方案时多次使用"我觉得可以试试"而非"这个方案最优"，表现出中等偏谨慎的决策风格。
                            </p>
                          </div>
                        )}
                        {dim === "communication" && (
                          <div className="mt-3 rounded-md bg-fox-cream/30 p-2">
                            <p className="text-xs text-fox-navy/80">
                              💡 <span className="font-medium">表达习惯：</span>
                              习惯使用"第一/第二/第三"的结构化表达，说明思维有条理，逻辑框架清晰。
                            </p>
                          </div>
                        )}
                        {dim === "learning" && (
                          <div className="mt-3 rounded-md bg-fox-cream/30 p-2">
                            <p className="text-xs text-fox-navy/80">
                              💡 <span className="font-medium">学习模式：</span>
                              主动反思过去的不足，诚实承认不懂的领域，这是高效学习者的典型特征。
                            </p>
                          </div>
                        )}
                        {dim === "work_style" && (
                          <div className="mt-3 rounded-md bg-fox-cream/30 p-2">
                            <p className="text-xs text-fox-navy/80">
                              💡 <span className="font-medium">做事风格：</span>
                              描述项目时提到具体工具和步骤，说明注重细节但缺乏完整时间线意识。
                            </p>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* 任务适配建议 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-fox-coral" />
                    任务适配建议
                  </CardTitle>
                  <CardDescription>基于角色类型和能力分布的推荐</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-600">
                      <Zap className="h-4 w-4" />
                      适合的任务
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {v3Data.task_recommendations.suitable.map((item, idx) => (
                        <Badge key={idx} className="bg-emerald-50 text-emerald-700 border-0">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-fox-coral">
                      <AlertTriangle className="h-4 w-4" />
                      需谨慎的任务
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {v3Data.task_recommendations.caution.map((item, idx) => (
                        <Badge key={idx} className="bg-fox-coral/10 text-fox-coral border-0">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl bg-fox-cream/50 p-4">
                    <p className="text-xs font-semibold text-fox-gray">团队角色定位</p>
                    <p className="mt-1 text-sm text-fox-navy">
                      作为「{v3Data.twelve_type.primary_type}」型成员，{v3Data.twelve_type.primary_description}
                      建议安排需要分析能力和沟通协调的任务，充分发挥其结构化思维和团队协作优势。
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* 查看完整对话记录 */}
              <Card>
                <button
                  className="flex w-full items-center justify-between p-6"
                  onClick={() => setShowChatHistory(!showChatHistory)}
                >
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-5 w-5 text-fox-gray" />
                    查看完整对话记录
                  </CardTitle>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 text-fox-gray transition-transform",
                      showChatHistory && "rotate-180"
                    )}
                  />
                </button>
                {showChatHistory && (
                  <CardContent>
                    <p className="text-center text-sm text-fox-gray">
                      对话记录可在聊天页面查看
                    </p>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          )}
        </div>
      </main>
    </TooltipProvider>
  );
}
