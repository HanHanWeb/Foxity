"use client";

import { useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useAuth } from "@/lib/auth";

export default function JoinTeamPage() {
  const params = useParams<{ teamId: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const joinTeam = useStore((state) => state.joinTeam);
  const joiningRef = useRef(false);

  // 已登录用户：自动加入团队并跳转到测评
  useEffect(() => {
    if (loading || !user?.name || !user?.user_id) return;
    if (joiningRef.current) return;
    joiningRef.current = true;

    (async () => {
      try {
        await joinTeam(params.teamId, user.name, user.user_id);
        router.push(`/chat/${params.teamId}`);
      } catch (e) {
        console.error("join team error:", e);
        router.push(`/chat/${params.teamId}`);
      }
    })();
  }, [loading, user, params.teamId, joinTeam, router]);

  // 未登录用户会被 useAuth() 重定向到 /auth，这里不会渲染

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-fox-orange" />
        <p className="text-sm text-fox-gray">正在加入团队...</p>
      </div>
    </main>
  );
}
