"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users, ArrowLeft, ArrowRight, Crown, UserPlus } from "lucide-react";
import { HomeNavbar } from "@/components/Layout/HomeNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";

interface MyTeam {
  team_id: string;
  team_name: string;
  competition_type: string;
  organizer_name: string;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [owned, setOwned] = useState<MyTeam[]>([]);
  const [joined, setJoined] = useState<MyTeam[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && user) {
      (async () => {
        try {
          const res = await fetch("/api/teams", { credentials: "include" });
          if (res.ok) {
            const data = await res.json();
            setOwned(data.owned || []);
            setJoined(data.joined || []);
          }
        } catch (e) {
          console.error("fetch teams error:", e);
        } finally {
          setFetching(false);
        }
      })();
    } else if (!loading && !user) {
      setFetching(false);
    }
  }, [loading, user]);

  if (loading || fetching) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fox-gray" />
      </main>
    );
  }

  const renderTeamCard = (team: MyTeam) => (
    <Card
      key={team.team_id}
      className="cursor-pointer py-0 transition-all hover:shadow-md"
      onClick={() => router.push(`/team/${team.team_id}`)}
    >
      <CardContent className="flex items-center justify-between p-5">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-fox-navy">
            {team.team_name}
          </h3>
          <div className="mt-1 flex items-center gap-3 text-xs text-fox-gray">
            <span>团队码：<span className="font-mono font-bold text-fox-navy">{team.team_id}</span></span>
            <span>创建于 {new Date(team.created_at).toLocaleDateString("zh-CN")}</span>
          </div>
        </div>
        <ArrowRight className="ml-4 h-5 w-5 flex-shrink-0 text-fox-gray" />
      </CardContent>
    </Card>
  );

  const renderEmpty = (text: string) => (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-fox-cream">
          <Users className="h-7 w-7 text-fox-gray" />
        </div>
        <p className="text-sm text-fox-gray">{text}</p>
      </CardContent>
    </Card>
  );

  return (
    <main className="min-h-screen bg-fox-cream/30 pb-12">
      <HomeNavbar />

      <div className="mx-auto max-w-4xl px-4 pt-24 md:px-6">
        <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回首页
        </Button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-fox-navy">控制台</h1>
        </div>

        {/* 我创建的团队 */}
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <Crown className="h-5 w-5 text-fox-navy" />
            <h2 className="text-lg font-semibold text-fox-navy">我创建的</h2>
            <span className="text-sm text-fox-gray">({owned.length})</span>
          </div>
          {owned.length === 0 ? (
            <div className="flex flex-col items-center gap-3">
              {renderEmpty("还没有创建过团队")}
              <Button variant="secondary" onClick={() => router.push("/team/create")}>
                创建第一个团队
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {owned.map(renderTeamCard)}
            </div>
          )}
        </section>

        {/* 我加入的团队 */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-fox-navy" />
            <h2 className="text-lg font-semibold text-fox-navy">我加入的</h2>
            <span className="text-sm text-fox-gray">({joined.length})</span>
          </div>
          {joined.length === 0 ? (
            renderEmpty("还没有加入过团队")
          ) : (
            <div className="grid gap-3">
              {joined.map(renderTeamCard)}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
