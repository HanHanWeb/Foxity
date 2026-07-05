"use client";

import { create } from "zustand";
import { initialAssessmentState, mockProfiles, mockTeam } from "@/mock/data";
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
import { createId, createTeamCode } from "@/lib/utils";

interface StoreState {
  currentTeam: Team | null;
  teams: Team[];
  profiles: UserProfile[];
  currentProfile: UserProfile | null;
  mockProfile: UserProfile;
  messages: ChatMessage[];
  assessmentState: AssessmentState;
  hydrate: () => void;
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
}

function getInitialProfile(): UserProfile {
  return {
    user_id: createId("user"),
    user_name: "你",
    team_id: "FOX3A7",
    team_name: "挑战杯-智慧农业项目组",
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
  currentTeam: mockTeam,
  teams: [mockTeam],
  profiles: mockProfiles,
  currentProfile: null,
  mockProfile: mockProfiles[0],
  messages: [],
  assessmentState: initialAssessmentState,

  hydrate: () => {
    set({
      teams: [mockTeam],
      profiles: mockProfiles,
      currentTeam: mockTeam,
    });
  },

  loadTeam: async (teamId) => {
    try {
      const res = await fetch(`/api/teams/${teamId}`);
      if (!res.ok) return;
      const team: Team = await res.json();
      set((state) => ({
        currentTeam: team,
        teams: state.teams.some((t) => t.team_id === team.team_id)
          ? state.teams.map((t) => (t.team_id === team.team_id ? team : t))
          : [...state.teams, team],
        profiles: team.members.length > 0 ? team.members : mockProfiles,
      }));
    } catch (e) {
      console.error("loadTeam error:", e);
    }
  },

  createTeam: async (name, type, organizer, emoji) => {
    let teamId = createTeamCode();
    try {
      let unique = false;
      while (!unique) {
        const res = await fetch(`/api/teams/${teamId}`);
        if (res.status === 404) {
          unique = true;
        } else {
          teamId = createTeamCode();
        }
      }
    } catch (e) {
      console.error("createTeam dedup error:", e);
    }
    const team: Team = {
      team_id: teamId,
      team_name: name,
      team_emoji: emoji || "",
      competition_type: type,
      organizer_name: organizer,
      members: [],
      created_at: new Date().toISOString(),
    };
    try {
      await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(team),
      });
    } catch (e) {
      console.error("createTeam db error:", e);
    }
    set({ teams: [team, ...get().teams], currentTeam: team });
    return teamId;
  },

  joinTeam: async (teamId, userName, userId) => {
    const profile: UserProfile = {
      ...getInitialProfile(),
      user_id: userId || createId("user"),
      user_name: userName,
      team_id: teamId,
    };
    try {
      await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: profile.user_id,
          user_name: profile.user_name,
          team_id: profile.team_id,
          data: profile,
        }),
      });
    } catch (e) {
      console.error("joinTeam db error:", e);
    }
    set({
      profiles: [profile, ...get().profiles],
      currentProfile: profile,
    });
    return profile;
  },

  addMessage: (msg) => {
    const messages = [...get().messages, msg];
    set({ messages });
    const profile = get().currentProfile;
    if (profile?.user_id) {
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
      }).catch((e) => console.error("save chat-history error:", e));
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
    try {
      await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: profile.user_id,
          user_name: profile.user_name,
          team_id: profile.team_id,
          data: profile,
        }),
      });
    } catch (e) {
      console.error("saveProfile db error:", e);
    }
    set({
      profiles: [profile, ...get().profiles.filter((p) => p.user_id !== profile.user_id)],
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
        console.error("deleteTeam error:", res.status);
        return null;
      }
      const data = await res.json();
      const action = data.action as "deleted" | "left";
      // 从内存中移除该团队及其成员画像
      set((state) => ({
        teams: state.teams.filter((t) => t.team_id !== teamId),
        profiles: state.profiles.filter((p) => p.team_id !== teamId),
        currentTeam: state.currentTeam?.team_id === teamId ? null : state.currentTeam,
      }));
      return action;
    } catch (e) {
      console.error("deleteTeam error:", e);
      return null;
    }
  },
}));
