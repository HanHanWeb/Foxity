"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AbilityRadar } from "@/components/AbilityRadar";
import { AbilityBarList } from "@/components/AbilityBarList";
import { ScoreComparison } from "@/components/ScoreComparison";
import { TagCloud } from "@/components/TagCloud";
import { useStore } from "@/store/useStore";
import type { HardSkillKey } from "@/types";
import { hardSkillLabels, softSkillLabels } from "@/types";

export default function ProfilePage() {
  const params = useParams<{ teamId: string }>();
  const router = useRouter();
  const currentProfile = useStore((state) => state.currentProfile);
  const mockProfile = useStore((state) => state.mockProfile);

  const data = currentProfile ?? mockProfile;

  const radarData = (Object.keys(data.abilities) as HardSkillKey[]).map((key) => ({
    ability: key,
    label: hardSkillLabels[key],
    score: data.abilities[key].score,
    verified: data.abilities[key].verification_status,
  }));

  const allInsights = (Object.keys(data.abilities) as HardSkillKey[]).flatMap((key) =>
    data.abilities[key].insights.map((text) => ({ ability: key, text }))
  );

  // V2 软实力数据
  const softSkillData = data.v2_assessment?.soft_skills || {};
  const softSkillEntries = Object.entries(softSkillData);

  return (
    <main className="min-h-screen bg-fox-cream/30 pb-12">
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
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              导出
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col items-center text-center md:flex-row md:items-end md:gap-6 md:text-left"
        >
          <div className="relative">
            <img src="/fox.png" alt={data.user_name} width={100} height={100} className="rounded-2xl" />
            <Badge
              variant="default"
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-3 py-0.5 text-xs"
            >
              {data.core_positioning}
            </Badge>
          </div>
          <div className="mt-4 md:mt-0 md:pb-2">
            <h1 className="text-2xl font-bold text-fox-navy md:text-3xl">{data.user_name}</h1>
            <p className="mt-1 text-sm text-fox-gray">{data.team_name ?? "团队测评"}</p>
            <p className="mt-2 max-w-md text-sm text-fox-navy/80">{data.overview_summary}</p>
          </div>
        </motion.div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-4">
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="abilities">能力详解</TabsTrigger>
            <TabsTrigger value="behavior">软实力</TabsTrigger>
            <TabsTrigger value="growth">成长建议</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* V2 标签 */}
            {data.tags && data.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {data.tags.map((tag, idx) => (
                  <Badge key={idx} variant="default" className="text-sm">{tag}</Badge>
                ))}
              </div>
            )}

            {/* V2 高亮 */}
            {data.highlights && data.highlights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>亮点</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.highlights.map((h, idx) => (
                    <div key={idx} className="flex gap-2 text-sm text-fox-navy">
                      <span className="text-fox-orange">✨</span>
                      {h}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>能力雷达图</CardTitle>
                  <CardDescription>五大能力维度分布</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <AbilityRadar data={radarData} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>自评 vs 实测</CardTitle>
                  <CardDescription>你的自我认知准确度</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScoreComparison profile={data} />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>关键能力标签</CardTitle>
                <CardDescription>基于对话分析的能力关键词</CardDescription>
              </CardHeader>
              <CardContent>
                <TagCloud
                  tags={allInsights.slice(0, 12).map((item, idx) => ({
                    text: item.text.slice(0, 10),
                    importance: 100 - idx * 7,
                  }))}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="abilities" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>各维度能力详解</CardTitle>
                <CardDescription>点击维度查看详细分析和洞察</CardDescription>
              </CardHeader>
              <CardContent>
                <AbilityBarList profile={data} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="behavior" className="space-y-6">
            {/* V2 软实力叙述 */}
            {data.soft_skill_narrative && (
              <Card>
                <CardHeader>
                  <CardTitle>软实力画像</CardTitle>
                  <CardDescription>Foxity 的观察笔记</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-fox-navy">{data.soft_skill_narrative}</p>
                </CardContent>
              </Card>
            )}

            {/* V2 软实力分数 */}
            {softSkillEntries.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>软实力维度</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {softSkillEntries.map(([key, val], idx) => {
                    const label = softSkillLabels[key as keyof typeof softSkillLabels] || val.label || key;
                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                      >
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-medium text-fox-navy">{label}</span>
                          <span className="font-semibold text-fox-navy">{val.score}/10</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-fox-gray-bg">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${val.score * 10}%` }}
                            transition={{ duration: 0.6, delay: idx * 0.05 }}
                            className="h-full rounded-full bg-fox-mint"
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* 旧版行为模式（兼容） */}
            {data.behavior_patterns && (
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  {
                    title: "压力反应模式",
                    value: data.behavior_patterns.stress_response,
                    color: "bg-fox-navy",
                  },
                  {
                    title: "决策风格",
                    value: data.behavior_patterns.decision_style,
                    color: "bg-fox-orange",
                  },
                  {
                    title: "协作倾向",
                    value: data.behavior_patterns.collaboration_style,
                    color: "bg-fox-mint",
                  },
                  {
                    title: "学习模式",
                    value: data.behavior_patterns.learning_style,
                    color: "bg-fox-yellow",
                  },
                ].map((item, idx) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.06 }}
                  >
                    <Card>
                      <CardContent className="pt-6">
                        <div className="mb-3 flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white ${item.color}`}
                          >
                            {idx + 1}
                          </div>
                          <div>
                            <h3 className="font-bold text-fox-navy">{item.title}</h3>
                            <Badge variant="outline">{item.value}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="growth" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>成长建议</CardTitle>
                <CardDescription>Foxity 的个性化建议</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.growth_suggestions.map((suggestion, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.08 }}
                    className="flex gap-4 rounded-xl border border-fox-gray-light bg-white p-4"
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-fox-orange text-sm font-bold text-white">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-fox-navy">{suggestion.area}</h4>
                      <p className="mt-1 text-sm text-fox-gray">{suggestion.suggestion}</p>
                      <p className="mt-2 text-xs text-fox-mint">
                        优先级：
                        {suggestion.priority === "high"
                          ? "高"
                          : suggestion.priority === "medium"
                          ? "中"
                          : "低"}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
