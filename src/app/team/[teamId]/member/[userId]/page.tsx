"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, BarChart3, Brain, MessageSquareQuote, Target, ChevronDown, Loader2, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/store/useStore";
import { mockProfiles } from "@/mock/data";
import { abilityLabels, softSkillLabels, type LeaderSummary, type LeaderSkillAssessment, type ChatMessage as ChatMessageType } from "@/types";
import { cn } from "@/lib/utils";

const statusConfig = {
  verified: { label: "已验证", icon: "✅", color: "text-emerald-600 bg-emerald-50" },
  unverified: { label: "待验证", icon: "⚠️", color: "text-amber-600 bg-amber-50" },
  untested: { label: "未涉及", icon: "❓", color: "text-gray-500 bg-gray-100" },
};

export default function MemberSummaryPage() {
  const params = useParams<{ teamId: string; userId: string }>();
  const router = useRouter();
  const profiles = useStore((state) => state.profiles);

  const [leaderSummary, setLeaderSummary] = useState<LeaderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChatHistory, setShowChatHistory] = useState(false);

  const profile = useMemo(() => {
    const allProfiles = profiles.length > 0 ? profiles : mockProfiles;
    return allProfiles.find((p) => p.user_id === params.userId) ?? allProfiles[0];
  }, [profiles, params.userId]);

  const [chatHistory, setChatHistory] = useState<ChatMessageType[]>([]);

  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const res = await fetch(`/api/chat-history/${params.userId}`);
        if (res.ok) {
          const data = await res.json();
          setChatHistory(
            (data as any[]).map((m) => ({
              role: m.role,
              content: m.content,
              emotion: m.emotion,
              timestamp: m.created_at,
            }))
          );
        }
      } catch (e) {
        console.error("load chat history error:", e);
      }
    };
    loadChatHistory();
  }, [params.userId]);

  useEffect(() => {
    const generateSummary = async () => {
      if (!profile || chatHistory.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: chatHistory,
            user_name: profile.user_name,
            viewer_role: "leader",
          }),
        });

        if (!res.ok) throw new Error("生成失败");

        const data = await res.json();
        if (data.leader_summary) {
          setLeaderSummary(data.leader_summary);
        } else {
          setError("AI 未能生成评估，请稍后重试");
        }
      } catch (e: any) {
        setError(e?.message || "生成失败");
      } finally {
        setLoading(false);
      }
    };

    generateSummary();
  }, [profile, chatHistory]);

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-fox-gray">未找到该成员</p>
      </main>
    );
  }

  const topScores = leaderSummary
    ? [
        ...leaderSummary.hard_skills.map((s) => ({ label: abilityLabels[s.dimension as keyof typeof abilityLabels] || s.dimension, score: s.score })),
        ...leaderSummary.soft_skills.map((s) => ({ label: softSkillLabels[s.dimension as keyof typeof softSkillLabels] || s.dimension, score: s.score })),
      ]
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
    : [];

  return (
    <main className="min-h-screen bg-[#fbf7ef] pb-12">
      <header className="sticky top-0 z-30 border-b border-fox-gray-light bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 md:px-6">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/team/${params.teamId}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回团队看板
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
        {/* 成员头部 */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-3xl font-bold text-fox-navy">{profile.user_name}</h1>
          {!loading && leaderSummary && topScores.length > 0 && (
            <p className="mt-2 text-sm text-fox-gray">
              {topScores.map((s, i) => (
                <span key={i}>
                  {i > 0 && " · "}
                  {s.label} {s.score}
                </span>
              ))}
            </p>
          )}
        </motion.div>

        {loading && (
          <div className="mt-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-fox-orange" />
            <p className="text-sm text-fox-gray">Foxity 正在分析该成员的对话记录...</p>
          </div>
        )}

        {error && (
          <div className="mt-20 flex flex-col items-center justify-center gap-4">
            <p className="text-sm text-fox-coral">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>重试</Button>
          </div>
        )}

        {!loading && !leaderSummary && !error && (
          <div className="mt-20 flex flex-col items-center justify-center gap-4">
            <p className="text-sm text-fox-gray">该成员还没有对话记录，无法生成队长视角评估</p>
          </div>
        )}

        {leaderSummary && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mt-8 space-y-6"
          >
            {/* 硬技能评估 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-fox-orange" />
                  硬技能评估
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {leaderSummary.hard_skills.map((skill, idx) => (
                  <SkillAssessmentItem key={idx} skill={skill} />
                ))}
              </CardContent>
            </Card>

            {/* 软实力评估 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-fox-mint" />
                  软实力评估
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {leaderSummary.soft_skills.map((skill, idx) => (
                  <SkillAssessmentItem key={idx} skill={skill} />
                ))}
              </CardContent>
            </Card>

            {/* 关键对话证据 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquareQuote className="h-5 w-5 text-fox-navy" />
                  关键对话证据
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[...leaderSummary.hard_skills, ...leaderSummary.soft_skills]
                  .filter((s) => s.key_quotes && s.key_quotes.length > 0)
                  .map((skill, idx) => {
                    const dimLabel = abilityLabels[skill.dimension as keyof typeof abilityLabels] ||
                      softSkillLabels[skill.dimension as keyof typeof softSkillLabels] ||
                      skill.dimension;
                    return skill.key_quotes.map((quote, qIdx) => (
                      <div key={`${idx}-${qIdx}`} className="rounded-xl border border-fox-gray-light bg-white p-4">
                        <p className="text-sm text-fox-navy">"{quote}"</p>
                        <p className="mt-2 text-xs text-fox-gray">→ {dimLabel} {skill.score > 0 ? `+${skill.score * 0.1}` : ""}</p>
                      </div>
                    ));
                  })}
                {leaderSummary.hard_skills.concat(leaderSummary.soft_skills).every((s) => !s.key_quotes || s.key_quotes.length === 0) && (
                  <p className="text-sm text-fox-gray">暂无关键对话证据</p>
                )}
              </CardContent>
            </Card>

            {/* 团队适配建议 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-fox-coral" />
                  团队适配建议
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-semibold text-emerald-600">适合</p>
                  <div className="flex flex-wrap gap-2">
                    {leaderSummary.team_fit.suitable.map((item, idx) => (
                      <Badge key={idx} className="bg-emerald-50 text-emerald-700">{item}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-semibold text-fox-coral">不适合</p>
                  <div className="flex flex-wrap gap-2">
                    {leaderSummary.team_fit.not_suitable.map((item, idx) => (
                      <Badge key={idx} className="bg-fox-coral/10 text-fox-coral">{item}</Badge>
                    ))}
                  </div>
                </div>
                {leaderSummary.team_fit.notes && (
                  <div className="rounded-xl bg-fox-cream/50 p-4">
                    <p className="text-xs font-semibold text-fox-gray">注意事项</p>
                    <p className="mt-1 text-sm text-fox-navy">{leaderSummary.team_fit.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 完整对话记录 */}
            {chatHistory.length > 0 && (
              <Card>
                <button
                  className="flex w-full items-center justify-between p-6"
                  onClick={() => setShowChatHistory(!showChatHistory)}
                >
                  <CardTitle className="flex items-center gap-2">
                    <ScrollText className="h-5 w-5 text-fox-gray" />
                    查看完整对话记录
                  </CardTitle>
                  <ChevronDown className={cn("h-5 w-5 text-fox-gray transition-transform", showChatHistory && "rotate-180")} />
                </button>
                {showChatHistory && (
                  <CardContent>
                    <div className="max-h-[500px] space-y-3 overflow-y-auto">
                      {chatHistory.map((msg, idx) => (
                        <div key={idx} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                          <div
                            className={cn(
                              "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                              msg.role === "user"
                                ? "bg-fox-navy text-white"
                                : "bg-fox-cream text-fox-navy"
                            )}
                          >
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}
          </motion.div>
        )}
      </div>
    </main>
  );
}

function SkillAssessmentItem({ skill }: { skill: LeaderSkillAssessment }) {
  const dimLabel = abilityLabels[skill.dimension as keyof typeof abilityLabels] ||
    softSkillLabels[skill.dimension as keyof typeof softSkillLabels] ||
    skill.dimension;
  const status = statusConfig[skill.status] || statusConfig.untested;

  return (
    <div className="rounded-xl border border-fox-gray-light bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-fox-navy">{dimLabel}</span>
          <span className="text-lg font-bold text-fox-navy">{skill.score}/10</span>
        </div>
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", status.color)}>
          {status.icon} {status.label}
        </span>
      </div>
      <p className="mt-2 text-sm text-fox-navy">{skill.summary}</p>
      <p className="mt-1 text-xs text-fox-gray">证据：{skill.evidence}</p>
    </div>
  );
}
