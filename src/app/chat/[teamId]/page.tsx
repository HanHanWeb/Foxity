"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Menu, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ChatMessage } from "@/components/ChatMessage";
import { InsightCard } from "@/components/InsightCard";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { sendToAI } from "@/lib/ai";
import type { ChatMessage as ChatMessageType, AbilityKey } from "@/types";
import { useStore } from "@/store/useStore";
import { abilityLabels } from "@/types";

function ChatPageInner() {
  const params = useParams<{ teamId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = useStore((state) => state.messages);
  const addMessage = useStore((state) => state.addMessage);
  const updateScores = useStore((state) => state.updateScores);
  const markEvent = useStore((state) => state.markEvent);
  const setProfile = useStore((state) => state.setProfile);
  const profile = useStore((state) => state.currentProfile);
  const saveProfile = useStore((state) => state.saveProfile);
  const startConversation = useStore((state) => state.startConversation);

  const [input, setInput] = useState("");
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [progress, setProgress] = useState(5);
  const userName = searchParams.get("user") ?? "你";

  useEffect(() => {
    if (messages.length === 0) {
      startConversation(userName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isAIThinking]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isAIThinking) return;
    setInput("");

    const userMsg: ChatMessageType = {
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    addMessage(userMsg);
    setIsAIThinking(true);

    // 读取最新的 store messages（避免闭包旧值）
    const latestMessages = useStore.getState().messages;

    try {
      const response = await sendToAI([...latestMessages], userName);
      const aiMsg: ChatMessageType = {
        role: "fox",
        content: response.reply,
        timestamp: Date.now(),
        emotion: response.emotion,
      };
      addMessage(aiMsg);

      if (response.scores_delta) {
        updateScores(response.scores_delta);
      }
      if (response.event) {
        markEvent(response.event);
      }
      if (response.phase) {
        const phaseToProgress: Record<string, number> = {
          background: 25,
          self_assessment: 45,
          challenge: 70,
          feedback: 90,
          summary: 100,
        };
        setProgress(phaseToProgress[response.phase] ?? progress);
      }
      if (response.profile_data) {
        setProfile(response.profile_data);
        saveProfile();
      }
    } finally {
      setIsAIThinking(false);
    }
  };

  const handleQuickReply = (reply: string) => {
    setInput(reply);
  };

  const quickReplies = [
    "我觉得是产品吧",
    "大概7分？",
    "有一次团队冲突的经历",
    "我技术不错",
  ];

  const currentPhase =
    progress < 25
      ? "背景摸底"
      : progress < 45
      ? "自评分"
      : progress < 70
      ? "挑战验证"
      : progress < 100
      ? "反馈解读"
      : "总结";

  const topInsights = profile
    ? (Object.keys(profile.abilities) as AbilityKey[])
        .filter((k) => profile.abilities[k].insights.length > 0)
        .slice(0, 3)
        .map((k) => ({
          key: k,
          text: profile.abilities[k].insights[0],
          score: profile.abilities[k].score,
          verified: profile.abilities[k].verification_status,
        }))
    : [];

  return (
    <div className="flex h-screen flex-col bg-fox-cream/30">
      <header className="flex items-center justify-between border-b border-fox-gray-light bg-white px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px]">
              <SheetHeader>
                <SheetTitle>测评进度</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-fox-navy">总体进度</span>
                    <span className="text-sm font-bold text-fox-orange">{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
                <div className="pt-2">
                  <p className="mb-2 text-sm font-semibold text-fox-navy">当前阶段</p>
                  <Badge variant="default" className="w-full justify-center">
                    {currentPhase}
                  </Badge>
                </div>
                {profile && (
                  <div className="pt-2">
                    <p className="mb-2 text-sm font-semibold text-fox-navy">已解锁能力</p>
                    <div className="space-y-1.5">
                      {(Object.keys(profile.abilities) as AbilityKey[]).map((key) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-xs text-fox-gray">{abilityLabels[key]}</span>
                          <span
                            className={`text-xs font-bold ${
                              profile.abilities[key].verification_status === "untested"
                                ? "text-fox-gray-light"
                                : "text-fox-orange"
                            }`}
                          >
                            {profile.abilities[key].verification_status === "untested"
                              ? "待验证"
                              : `${profile.abilities[key].score}分`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          <img src="/fox.png" alt="Foxity" width={40} height={40} className="rounded-lg" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-fox-navy">Foxity</h1>
              {isAIThinking && <span className="text-xs text-fox-gray">正在思考...</span>}
            </div>
            <p className="text-xs text-fox-gray">
              阶段：{currentPhase} · {progress}%
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <div className="w-48">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs text-fox-gray">测评进度</span>
              <span className="text-xs font-bold text-fox-orange">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/profile/${params.teamId}`)}
            disabled={progress < 50}
          >
            查看画像
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-6 md:px-8">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <ChatMessage message={msg} />
              </motion.div>
            ))}
          </AnimatePresence>
          {isAIThinking && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ChatMessage
                message={{
                  role: "fox",
                  content: "",
                  timestamp: Date.now(),
                  isTyping: true,
                }}
              />
            </motion.div>
          )}
        </div>

        <aside className="hidden w-72 flex-shrink-0 border-l border-fox-gray-light bg-white p-4 lg:block">
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-sm font-bold text-fox-navy">测评进度</h3>
              <Progress value={progress} />
              <p className="mt-2 text-xs text-fox-gray">当前阶段：{currentPhase}</p>
            </div>
            <div>
              <h3 className="mb-2 flex items-center gap-1 text-sm font-bold text-fox-navy">
                <Lightbulb className="h-4 w-4 text-fox-orange" />
                实时洞察
              </h3>
              {topInsights.length > 0 ? (
                <div className="space-y-2">
                  {topInsights.map((item, idx) => (
                    <InsightCard
                      key={item.key}
                      icon="💡"
                      text={item.text}
                      index={idx}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-fox-gray">聊几句，洞察会慢慢出现～</p>
              )}
            </div>
          </div>
        </aside>
      </div>

      <div className="border-t border-fox-gray-light bg-white p-4 md:px-8 md:py-5">
        <div className="mx-auto max-w-3xl">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="回复 Foxity..."
              className="rounded-xl"
            />
            <Button variant="secondary" onClick={handleSend} disabled={!input.trim() || isAIThinking}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatPageInner />
    </Suspense>
  );
}
