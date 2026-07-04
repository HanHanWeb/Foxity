"use client";

import { create } from "zustand";
import { initialAssessmentState, mockProfiles, mockTeam } from "@/mock/data";
import type {
  AbilityKey,
  AssessmentState,
  ChatMessage,
  DimensionStatus,
  Expression,
  Team,
  UserProfile,
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
  createTeam: (name: string, type: string, organizer: string) => Promise<string>;
  joinTeam: (teamId: string, userName: string) => Promise<UserProfile>;
  addMessage: (msg: ChatMessage) => void;
  updateScores: (delta: Partial<Record<AbilityKey, number>>) => void;
  markEvent: (event: string) => void;
  setProfile: (data: Partial<UserProfile>) => void;
  saveProfile: () => Promise<void>;
  startConversation: (userName: string) => void;
  updateExpression: (expr: Expression) => void;
  updateDimensionStatus: (dim: AbilityKey, status: DimensionStatus) => void;
  triggerKeyEvent: (type: "stress" | "conflict") => void;
  addInsight: (insight: { icon: string; text: string }) => void;
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
      background_market: {
        score: 0,
        verification_status: "untested",
        insights: [],
        evidence_events: [],
      },
      product: {
        score: 0,
        verification_status: "untested",
        insights: [],
        evidence_events: [],
      },
      tech: {
        score: 0,
        verification_status: "untested",
        insights: [],
        evidence_events: [],
      },
      finance: {
        score: 0,
        verification_status: "untested",
        insights: [],
        evidence_events: [],
      },
      design: {
        score: 0,
        verification_status: "untested",
        insights: [],
        evidence_events: [],
      },
    },
    growth_suggestions: [],
  };
}

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
      set({
        currentTeam: team,
        profiles: team.members.length > 0 ? team.members : mockProfiles,
      });
    } catch (e) {
      console.error("loadTeam error:", e);
    }
  },

  createTeam: async (name, type, organizer) => {
    let teamId = createTeamCode();
    // 查重，确保 team_id 不重复
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
      competition_type: type,
      organizer_name: organizer,
      members: [],
      created_at: new Date().toISOString(),
    };
    // 写入数据库
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

  joinTeam: async (teamId, userName) => {
    const profile: UserProfile = {
      ...getInitialProfile(),
      user_id: createId("user"),
      user_name: userName,
      team_id: teamId,
    };
    // 写入数据库
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
    // 同步保存对话记录到数据库
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

  updateScores: (delta) => {
    const current = get().currentProfile ?? getInitialProfile();
    const newAbilities = { ...current.abilities };
    (Object.keys(delta) as AbilityKey[]).forEach((key) => {
      const d = delta[key] ?? 0;
      newAbilities[key] = {
        ...newAbilities[key],
        score: Math.min(10, Math.max(0, newAbilities[key].score + d)),
        verification_status: newAbilities[key].score + d > 0 ? "unverified" : "untested",
      };
    });
    const updated = { ...current, abilities: newAbilities };
    set({ currentProfile: updated });
  },

  markEvent: (event) => {
    const current = get().currentProfile ?? getInitialProfile();
    const allEvents = Object.values(current.abilities).flatMap((a) => a.evidence_events);
    if (allEvents.includes(event)) return;
    const newAbilities = { ...current.abilities };
    const firstIncomplete = (Object.keys(newAbilities) as AbilityKey[]).find(
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
    // 写入数据库
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
    // 更新本地 state
    set({
      profiles: [profile, ...get().profiles.filter((p) => p.user_id !== profile.user_id)],
    });
  },

  startConversation: (userName) => {
    const profile: UserProfile = {
      ...getInitialProfile(),
      user_name: userName,
    };
    const welcome: ChatMessage = {
      role: "fox",
      content: `嗨，${userName}！我是 Foxity～我们来聊聊天吧，你觉得自己比较擅长的3件事是什么？最好带点例子哦。`,
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
}));
