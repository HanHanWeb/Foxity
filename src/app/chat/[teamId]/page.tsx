"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Menu, Lightbulb, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ChatMessage } from "@/components/ChatMessage";
import { InsightCard } from "@/components/InsightCard";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { sendToAI } from "@/lib/ai";
import type { ChatMessage as ChatMessageType } from "@/types";
import { useStore } from "@/store/useStore";

function ChatPageInner() {
  const params = useParams<{ teamId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = useStore((state) => state.messages);
  const addMessage = useStore((state) => state.addMessage);
  const profile = useStore((state) => state.currentProfile);
  const saveProfile = useStore((state) => state.saveProfile);
  const startConversation = useStore((state) => state.startConversation);
  const applyAssessment = useStore((state) => state.applyAssessment);
  const setProfile = useStore((state) => state.setProfile);

  const [input, setInput] = useState("");
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [assessmentDone, setAssessmentDone] = useState(false);
  const [highlights, setHighlights] = useState<string[]>([]);
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

      // 实时亮点
      if (response.highlights && response.highlights.length > 0) {
        const newHighlights = [...new Set([...highlights, ...response.highlights])].slice(-8);
        setHighlights(newHighlights);
        setProfile({ highlights: newHighlights });
      }

      // V2：如果包含画像数据，一次性应用
      if (response.is_final && response.assessment_data) {
        // 合并实时亮点和最终画像亮点
        const finalHighlights = response.assessment_data.highlights
          ? [...new Set([...highlights, ...response.assessment_data.highlights])]
          : highlights;

        applyAssessment(response.assessment_data);
        setHighlights(finalHighlights);
        setProfile({ highlights: finalHighlights });

        // 延迟保存，确保 applyAssessment 的 set 已完成
        setTimeout(() => {
          saveProfile();
        }, 100);
        setAssessmentDone(true);
        setProgress(100);
      } else {
        // 基于对话轮数估算进度
        const userTurns = latestMessages.filter((m) => m.role === "user").length;
        const estimatedProgress = Math.min(90, Math.round((userTurns / 12) * 100));
        setProgress((prev) => Math.max(prev, estimatedProgress));
      }
    } finally {
      setIsAIThinking(false);
    }
  };

  const currentPhase =
    progress < 15
      ? "破冰找方向"
      : progress < 50
      ? "深度挖掘"
      : progress < 75
      ? "交叉验证"
      : progress < 100
      ? "收尾总结"
      : "已完成";

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
                <div className="pt-2">
                  <h3 className="mb-2 flex items-center gap-1 text-sm font-bold text-fox-navy">
                    <Lightbulb className="h-4 w-4 text-fox-orange" />
                    亮点
                  </h3>
                  {highlights.length > 0 ? (
                    <div className="space-y-2">
                      {highlights.map((h, idx) => (
                        <InsightCard key={idx} icon="✨" text={h} index={idx} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-fox-gray">聊几句，亮点会慢慢出现～</p>
                  )}
                </div>
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
            disabled={!assessmentDone}
          >
            <UserCircle className="mr-1.5 h-4 w-4" />
            查看画像
          </Button>
        </div>

        {/* 移动端查看画像按钮 */}
        <Button
          variant="outline"
          size="icon"
          className="md:hidden"
          onClick={() => router.push(`/profile/${params.teamId}`)}
          disabled={!assessmentDone}
        >
          <UserCircle className="h-4 w-4" />
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 左侧对话区域（含输入框） */}
        <div className="flex flex-1 flex-col overflow-hidden">
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
            {assessmentDone && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center pt-4"
              >
                <Button
                  variant="secondary"
                  onClick={() => router.push(`/profile/${params.teamId}`)}
                >
                  查看完整画像 →
                </Button>
              </motion.div>
            )}
          </div>

          {/* 输入框：属于左侧对话区域底部 */}
          <div className="border-t border-fox-gray-light bg-white px-4 py-4 md:px-8">
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

        {/* 右侧侧栏：只保留亮点 */}
        <aside className="hidden w-72 flex-shrink-0 border-l border-fox-gray-light bg-white p-4 lg:block">
          <div>
            <h3 className="mb-2 flex items-center gap-1 text-sm font-bold text-fox-navy">
              <Lightbulb className="h-4 w-4 text-fox-orange" />
              亮点
            </h3>
            {highlights.length > 0 ? (
              <div className="space-y-2">
                {highlights.map((h, idx) => (
                  <InsightCard key={idx} icon="✨" text={h} index={idx} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-fox-gray">聊几句，亮点会慢慢出现～</p>
            )}
          </div>
        </aside>
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
