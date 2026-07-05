"use client";

import { create } from "zustand";
import { initialAssessmentState } from "@/mock/data";
import type {
  HardSkillKey,
  AssessmentState,
  ChatMessage,
  DimensionStatus,
  Expression,
  Team,
  UserProfile,
  V2AssessmentData,
} from "@/types";
import { createId } from "@/lib/utils";
import { toast } from "@/lib/toast";

interface StoreState {
  currentTeam: Team | null;
  teams: Team[];
  profiles: UserProfile[];
  currentProfile: UserProfile | null;
  messages: ChatMessage[];
  assessmentState: AssessmentState;
  loadTeam: (teamId: string) => Promise<void>;
  createTeam: (name: string, type: string, organizer: string, emoji?: string) => Promise<string>;
  joinTeam: (teamId: string, userName: string, userId?: string) => Promise<UserProfile>;
  addMessage: (msg: ChatMessage) => void;
  markEvent: (event: string) => void;
  setProfile: (data: Partial<UserProfile>) => void;
  saveProfile: () => Promise<void>;
  startConversation: (userName: string, userId?: string, teamId?: string) => void;
  updateExpression: (expr: Expression) => void;
  updateDimensionStatus: (dim: HardSkillKey, status: DimensionStatus) => void;
  triggerKeyEvent: (type: "stress" | "conflict") => void;
  addInsight: (insight: { icon: string; text: string }) => void;
  applyAssessment: (data: V2AssessmentData) => void;
  deleteTeam: (teamId: string) => Promise<"deleted" | "left" | null>;
  updateMemberPosition: (teamId: string, userId: string, position: string) => Promise<boolean>;
  removeMember: (teamId: string, userId: string) => Promise<boolean>;
  // 当前用户在当前团队的角色
  currentUserRole: "leader" | "member" | null;
  currentUserId: string | null;
}

function getInitialProfile(): UserProfile {
  return {
    user_id: createId("user"),
    user_name: "你",
    team_id: "",
    team_name: "",
    timestamp: new Date().toISOString(),
    core_positioning: "待测评",
    overview_summary: "完成测评后，Foxity 会为你生成完整的个人画像。",
    abilities: {
      market_analysis: { score: 0, verification_status: "untested", insights: [], evidence_events: [] },
      product_thinking: { score: 0, verification_status: "untested", insights: [], evidence_events: [] },
      technical: { score: 0, verification_status: "untested", insights: [], evidence_events: [] },
      business_finance: { score: 0, verification_status: "untested", insights: [], evidence_events: [] },
      design: { score: 0, verification_status: "untested", insights: [], evidence_events: [] },
    },
    growth_suggestions: [],
  };
}

// V2 画像数据 key 到硬技能 key 的映射
const hardSkillKeyMap: Record<string, HardSkillKey> = {
  market_analysis: "market_analysis",
  product_thinking: "product_thinking",
  technical: "technical",
  business_finance: "business_finance",
  design: "design",
};

export const useStore = create<StoreState>((set, get) => ({
  currentTeam: null,
  teams: [],
  profiles: [],
  currentUserRole: null,
  currentUserId: null,
  currentProfile: null,
  messages: [],
  assessmentState: initialAssessmentState,

  loadTeam: async (teamId) => {
    try {
      const res = await fetch(`/api/teams/${teamId}`);
      if (!res.ok) {
        console.warn("[loadTeam] API not ok:", res.status);
        return;
      }
      const data = await res.json();
      const team: Team = data;
      set((state) => {
        // 只替换当前团队的 profiles，保留其他团队的
        const otherProfiles = state.profiles.filter((p) => p.team_id !== team.team_id);
        return {
          currentTeam: team,
          teams: state.teams.some((t) => t.team_id === team.team_id)
            ? state.teams.map((t) => (t.team_id === team.team_id ? team : t))
            : [...state.teams, team],
          profiles: [...otherProfiles, ...(team.members || [])],
          currentUserRole: (data.currentUserRole as "leader" | "member") || null,
          currentUserId: data.currentUserId || null,
        };
      });
    } catch (e) {
      console.error("loadTeam error:", e);
    }
  },

  createTeam: async (name, type, organizer, emoji) => {
    // 服务端负责生成/校验 team_id，前端只把参数传过去
    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        team_name: name,
        competition_type: type,
        organizer_name: organizer,
        team_emoji: emoji || "",
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("createTeam api error:", res.status, errText);
      toast.error("创建团队失败", res.status === 401 ? "请先登录" : undefined);
      throw new Error("创建团队失败");
    }
    const data = await res.json();
    if (!data?.team_id) {
      toast.error("创建团队失败", "服务端未返回有效的团队 ID");
      throw new Error("服务端未返回 team_id");
    }
    const team: Team = {
      team_id: data.team_id,
      team_name: data.team_name || name,
      team_emoji: data.team_emoji || emoji || "",
      competition_type: data.competition_type || type,
      organizer_name: data.organizer_name || organizer,
      members: [],
      created_at: data.created_at || new Date().toISOString(),
    };
    set((state) => ({
      teams: [team, ...state.teams.filter((t) => t.team_id !== team.team_id)],
      currentTeam: team,
    }));
    return team.team_id;
  },

  joinTeam: async (teamId, userName, userId) => {
    // 优先使用入参 userId，但尝试用 session 真实 user_id 覆盖，避免伪造
    let effectiveUserId = userId || createId("user");
    try {
      const meRes = await fetch("/api/auth/me", { credentials: "include" });
      if (meRes.ok) {
        const me = await meRes.json();
        if (me?.user_id) {
          effectiveUserId = me.user_id;
        }
      }
    } catch {
      // 未登录时忽略，继续用入参/生成的 id
    }

    const profile: UserProfile = {
      ...getInitialProfile(),
      user_id: effectiveUserId,
      user_name: userName,
      team_id: teamId,
    };
    try {
      const profRes = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          user_id: profile.user_id,
          user_name: profile.user_name,
          team_id: profile.team_id,
          data: profile,
        }),
      });
      if (!profRes.ok) {
        toast.warning("画像未保存", profRes.status === 401 ? "请先登录" : "请稍后重试");
      }
      // 同步写入 team_members 表（服务端会以 session 用户为准）
      const memRes = await fetch(`/api/teams/${teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          user_name: profile.user_name,
        }),
      });
      if (!memRes.ok) {
        toast.warning("加入团队记录未保存", memRes.status === 401 ? "请先登录" : "请稍后重试");
      }
    } catch (e) {
      console.error("joinTeam db error:", e);
      toast.error("加入团队失败", "网络错误，请重试");
    }
    set((state) => ({
      profiles: [profile, ...state.profiles.filter((p) => !(p.user_id === profile.user_id && p.team_id === profile.team_id))],
      currentProfile: profile,
    }));
    return profile;
  },

  addMessage: (msg) => {
    const messages = [...get().messages, msg];
    set({ messages });
    const profile = get().currentProfile;
    const isGuest = profile?.user_id?.startsWith("guest-");
    if (profile?.user_id && profile?.team_id && !isGuest) {
      fetch("/api/chat-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: profile.user_id,
          team_id: profile.team_id,
          role: msg.role,
          content: msg.content,
          emotion: msg.emotion ?? msg.expression,
        }),
      }).catch((e) => console.error("[addMessage] save chat-history error:", e));
    } else if (isGuest) {
      console.log("[addMessage] 访客模式，跳过保存（请登录后对话以保存记录）");
    }
  },

  markEvent: (event) => {
    const current = get().currentProfile ?? getInitialProfile();
    const allEvents = Object.values(current.abilities).flatMap((a) => a.evidence_events);
    if (allEvents.includes(event)) return;
    const newAbilities = { ...current.abilities };
    const firstIncomplete = (Object.keys(newAbilities) as HardSkillKey[]).find(
      (k) => newAbilities[k].verification_status !== "verified"
    );
    if (firstIncomplete) {
      newAbilities[firstIncomplete] = {
        ...newAbilities[firstIncomplete],
        evidence_events: [...newAbilities[firstIncomplete].evidence_events, event],
      };
    }
    set({ currentProfile: { ...current, abilities: newAbilities } });
  },

  setProfile: (data) => {
    const current = get().currentProfile ?? getInitialProfile();
    const updated = { ...current, ...data };
    set({ currentProfile: updated });
  },

  saveProfile: async () => {
    const profile = get().currentProfile;
    if (!profile) return;

    // 如果 currentProfile 是访客态的 user_id（guest 前缀），尝试用 session 用户覆盖
    let userId = profile.user_id;
    if (userId.startsWith("guest-")) {
      try {
        const meRes = await fetch("/api/auth/me", { credentials: "include" });
        if (meRes.ok) {
          const me = await meRes.json();
          if (me?.user_id) {
            userId = me.user_id;
          }
        }
      } catch {
        // 忽略：仍然尝试用原 user_id 保存，鉴权失败则跳过
      }
    }
    const profileToSave = { ...profile, user_id: userId };

    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          user_id: userId,
          user_name: profileToSave.user_name,
          team_id: profileToSave.team_id,
          data: profileToSave,
        }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error("[saveProfile] failed", res.status, errText);
        toast.error("画像保存失败", res.status === 401 ? "请先登录后再测评" : "请稍后重试");
      }
    } catch (e) {
      console.error("saveProfile db error:", e);
    }
    set({
      currentProfile: profileToSave,
      profiles: [profileToSave, ...get().profiles.filter((p) => p.user_id !== profileToSave.user_id)],
    });
  },

  startConversation: (userName, userId, teamId) => {
    const profile: UserProfile = {
      ...getInitialProfile(),
      user_name: userName,
      ...(userId ? { user_id: userId } : {}),
      ...(teamId ? { team_id: teamId } : {}),
    };
    const welcome: ChatMessage = {
      role: "fox",
      content: `嘿！我是 Foxity 🦊，一只专门帮人发现自己有多厉害的小狐狸。别紧张，这不是什么正经面试——就是聊聊天。先说说，你最近在忙什么？有没有什么东西让你觉得'这个我在行'？`,
      emotion: "smile",
      timestamp: Date.now(),
    };
    set({
      currentProfile: profile,
      messages: [welcome],
      assessmentState: initialAssessmentState,
    });
  },

  updateExpression: (expr) => {
    const assessmentState = { ...get().assessmentState, current_expression: expr };
    set({ assessmentState });
  },

  updateDimensionStatus: (dim, status) => {
    const assessmentState = {
      ...get().assessmentState,
      covered_dimensions: { ...get().assessmentState.covered_dimensions, [dim]: status },
    };
    set({ assessmentState });
  },

  triggerKeyEvent: (type) => {
    const assessmentState = {
      ...get().assessmentState,
      key_events: { ...get().assessmentState.key_events, [type]: true },
    };
    set({ assessmentState });
  },

  addInsight: (insight) => {
    const assessmentState = {
      ...get().assessmentState,
      insights: [insight, ...get().assessmentState.insights].slice(0, 6),
    };
    set({ assessmentState });
  },

  // V2：一次性应用画像数据
  applyAssessment: (data) => {
    const current = get().currentProfile ?? getInitialProfile();
    const newAbilities = { ...current.abilities };

    // 写入硬技能分数、洞察和证据
    Object.entries(data.hard_skills || {}).forEach(([key, val]) => {
      const hk = hardSkillKeyMap[key];
      if (hk && val) {
        newAbilities[hk] = {
          score: val.score,
          verification_status: val.score > 0 ? "verified" : "untested",
          insights: val.insights || [],
          evidence_events: val.evidence || [],
        };
      }
    });

    const updated: UserProfile = {
      ...current,
      core_positioning: data.tags?.[0] || current.core_positioning,
      overview_summary: data.summary || current.overview_summary,
      abilities: newAbilities,
      tags: data.tags,
      keyword_tags: data.keyword_tags,
      soft_skill_narrative: data.soft_skill_narrative,
      highlights: data.highlights,
      growth_suggestions: (data.areas_for_growth || []).map((g) => ({
        area: g.title,
        suggestion: g.detail,
        priority: g.priority === "高" ? "high" : g.priority === "中" ? "medium" : "low",
      })),
      v2_assessment: data,
      // V3 评分数据
      v3_score_data: (data as any).v3_score_data,
      v3_credibility: (data as any).v3_credibility,
      v3_type: (data as any).v3_type,
      v3_soft_skills: (data as any).v3_soft_skills,
    };
    set({ currentProfile: updated });
  },

  deleteTeam: async (teamId) => {
    try {
      const res = await fetch(`/api/teams/${teamId}`, { method: "DELETE" });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error("deleteTeam error response:", res.status, errText);
        toast.error("操作失败", res.status === 401 ? "请先登录" : "请稍后重试");
        return null;
      }
      const data = await res.json();
      const action = data.action as "deleted" | "left";
      // 仅移除该团队及其成员画像；不要覆盖其他团队的 profiles
      set((state) => ({
        teams: state.teams.filter((t) => t.team_id !== teamId),
        profiles: state.profiles.filter((p) => p.team_id !== teamId),
        currentTeam: state.currentTeam?.team_id === teamId ? null : state.currentTeam,
        currentUserRole: state.currentTeam?.team_id === teamId ? null : state.currentUserRole,
      }));
      return action;
    } catch (e) {
      console.error("deleteTeam error:", e);
      return null;
    }
  },

  updateMemberPosition: async (teamId, userId, position) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position }),
      });
      if (!res.ok) return false;
      // 本地更新 profiles 里的 position
      set((state) => ({
        profiles: state.profiles.map((p) =>
          p.user_id === userId && p.team_id === teamId
            ? { ...p, core_positioning: position }
            : p
        ),
      }));
      return true;
    } catch (e) {
      console.error("updateMemberPosition error:", e);
      return false;
    }
  },

  removeMember: async (teamId, userId) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/members/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) return false;
      set((state) => ({
        profiles: state.profiles.filter((p) => !(p.user_id === userId && p.team_id === teamId)),
      }));
      return true;
    } catch (e) {
      console.error("removeMember error:", e);
      return false;
    }
  },
}));
