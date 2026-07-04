"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { AbilityBar } from "@/components/AbilityBar";
import type { UserProfile, HardSkillKey } from "@/types";

interface AbilityBarListProps {
  profile: UserProfile;
}

export function AbilityBarList({ profile }: AbilityBarListProps) {
  const [expanded, setExpanded] = useState<HardSkillKey | null>(null);

  const abilities = Object.keys(profile.abilities) as HardSkillKey[];

  return (
    <div className="space-y-4">
      {abilities.map((key, idx) => {
        const ability = profile.abilities[key];
        const isExpanded = expanded === key;

        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="overflow-hidden rounded-xl border border-fox-gray-light bg-white"
          >
            <button
              onClick={() => setExpanded(isExpanded ? null : key)}
              className="w-full p-4 text-left transition-colors hover:bg-fox-cream/50"
            >
              <AbilityBar
                dimension={key}
                score={ability.score}
                verified={ability.verification_status}
              />
              <div className="mt-2 flex items-center justify-between gap-2 text-xs text-fox-gray">
                <span className="truncate">{ability.insights[0] ?? "暂无洞察"}</span>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
                )}
              </div>
            </button>

            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="border-t border-fox-gray-light px-4 py-3"
              >
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-fox-navy">详细洞察</h4>
                  <ul className="space-y-1.5">
                    {ability.insights.map((insight, i) => (
                      <li key={i} className="flex gap-2 text-sm text-fox-gray">
                        <span className="text-fox-orange">•</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-fox-gray-light">
                    证据事件：{ability.evidence_events.length > 0 ? `${ability.evidence_events.length} 条对话记录` : "暂无"}
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
