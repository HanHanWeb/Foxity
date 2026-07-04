"use client";

import { create } from "zustand";
import { initialAssessmentState, mockMessages, mockProfiles, mockTeam } from "@/mock/data";
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
import { readStorage, writeStorage } from "@/lib/storage";

interface StoreState {
  currentTeam: Team | null;
  teams: Team[];
  profiles: UserProfile[];
  currentProfile: UserProfile | null;
  mockProfile: UserProfile;
  messages: ChatMessage[];
  assessmentState: AssessmentState;
  hydrate: () => void;
  createTeam: (name: string, type: string, organizer: string) => string;
  joinTeam: (teamId: string, userName: string) => UserProfile;
  addMessage: (msg: ChatMessage) => void;
  updateScores: (delta: Partial<Record<AbilityKey, number>>) => void;
  markEvent: (event: string) => void;
  setProfile: (data: Partial<UserProfile>) => void;
  saveProfile: () => void;
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
    overview_summary: "完成测评后，狐狸学工会为你生成完整的个人画像。",
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

function persist(state: Pick<StoreState, "teams" | "profiles" | "messages" | "assessmentState" | "currentProfile">) {
  writeStorage("teams", state.teams);
  writeStorage("profiles", state.profiles);
  writeStorage("messages", state.messages);
  writeStorage("assessment", state.assessmentState);
  writeStorage("currentProfile", state.currentProfile);
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
    const teams = readStorage<Team[]>("teams", [mockTeam]);
    const profiles = readStorage<UserProfile[]>("profiles", mockProfiles);
    const messages = readStorage<ChatMessage[]>("messages", []);
    const assessmentState = readStorage<AssessmentState>("assessment", initialAssessmentState);
    const currentProfile = readStorage<UserProfile | null>("currentProfile", null);
    set({
      teams,
      profiles,
      messages,
      assessmentState,
      currentProfile,
      currentTeam: teams[0] ?? null,
    });
  },

  createTeam: (name, type, organizer) => {
    const teamId = createTeamCode();
    const team: Team = {
      team_id: teamId,
      team_name: name,
      competition_type: type,
      organizer_name: organizer,
      members: [],
      created_at: new Date().toISOString(),
    };
    const teams = [team, ...get().teams];
    set({ teams, currentTeam: team });
    persist({ ...get(), teams });
    return teamId;
  },

  joinTeam: (teamId, userName) => {
    const profile: UserProfile = {
      ...getInitialProfile(),
      user_id: createId("user"),
      user_name: userName,
      team_id: teamId,
    };
    const profiles = [profile, ...get().profiles];
    const teams = get().teams.map((team) =>
      team.team_id === teamId
        ? {
            ...team,
            members: [profile, ...team.members.filter((m) => m.user_id !== profile.user_id)],
          }
        : team
    );
    set({ profiles, currentProfile: profile, teams });
    persist({ ...get(), teams, profiles, currentProfile: profile });
    return profile;
  },

  addMessage: (msg) => {
    const messages = [...get().messages, msg];
    set({ messages });
    persist({ ...get(), messages });
    // 同步保存对话记录到 chat_history_{userId}
    const profile = get().currentProfile;
    if (profile?.user_id) {
      writeStorage(`chat_history_${profile.user_id}`, messages);
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

  saveProfile: () => {
    const profile = get().currentProfile;
    if (!profile) return;
    const profiles = [profile, ...get().profiles.filter((p) => p.user_id !== profile.user_id)];
    const teams = get().teams.map((team) =>
      team.team_id === profile.team_id
        ? {
            ...team,
            members: [profile, ...team.members.filter((m) => m.user_id !== profile.user_id)],
          }
        : team
    );
    set({ profiles, teams });
    persist({ ...get(), profiles, teams });
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
    set({ currentProfile: profile, messages: [welcome], assessmentState: initialAssessmentState });
    persist({
      ...get(),
      currentProfile: profile,
      messages: [welcome],
      assessmentState: initialAssessmentState,
    });
  },

  updateExpression: (expr) => {
    const assessmentState = { ...get().assessmentState, current_expression: expr };
    set({ assessmentState });
    persist({ ...get(), assessmentState });
  },

  updateDimensionStatus: (dim, status) => {
    const assessmentState = {
      ...get().assessmentState,
      covered_dimensions: { ...get().assessmentState.covered_dimensions, [dim]: status },
    };
    set({ assessmentState });
    persist({ ...get(), assessmentState });
  },

  triggerKeyEvent: (type) => {
    const assessmentState = {
      ...get().assessmentState,
      key_events: { ...get().assessmentState.key_events, [type]: true },
    };
    set({ assessmentState });
    persist({ ...get(), assessmentState });
  },

  addInsight: (insight) => {
    const assessmentState = {
      ...get().assessmentState,
      insights: [insight, ...get().assessmentState.insights].slice(0, 6),
    };
    set({ assessmentState });
    persist({ ...get(), assessmentState });
  },
}));
