"use client";

import { motion } from "framer-motion";
import type { UserProfile, HardSkillKey } from "@/types";
import { hardSkillLabels } from "@/types";

interface ScoreComparisonProps {
  profile: UserProfile;
}

export function ScoreComparison({ profile }: ScoreComparisonProps) {
  // V3 自评数据优先从 v3_score_data.self_scores 读取，兼容旧版 abilities.self_score
  const selfScoresMap: Record<string, number> =
    profile.v3_score_data?.self_scores || {};

  const abilities = (Object.keys(profile.abilities) as HardSkillKey[]).filter(
    (key) => {
      const v3Score = selfScoresMap[key];
      return v3Score !== undefined && v3Score > 0;
    }
  );

  // 刚测评完成但 V3 数据尚未就绪时，显示 loading 转圈
  const hasV3Data = !!profile.v3_score_data;
  if (abilities.length === 0 && !hasV3Data) {
    return (
      <div className="rounded-xl border border-dashed border-fox-gray-light bg-fox-gray-bg p-6 text-center">
        <p className="text-sm text-fox-gray">暂无自评数据，完成测评后可查看对比分析。</p>
      </div>
    );
  }

  if (abilities.length === 0 && hasV3Data) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-fox-gray-light bg-white p-6">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-fox-orange border-t-transparent" />
        <span className="ml-3 text-sm text-fox-gray">正在生成对比分析…</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {abilities.map((key, idx) => {
        const ability = profile.abilities[key];
        const selfScore = selfScoresMap[key] ?? ability.self_score ?? ability.score;
        const actual = ability.score;
        const diff = actual - selfScore;
        const isLow = diff > 0;
        const isHigh = diff < 0;
        const isAccurate = Math.abs(diff) <= 1;

        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.06 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-fox-navy">{hardSkillLabels[key]}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  isAccurate
                    ? "bg-fox-mint/20 text-fox-mint-dark"
                    : isLow
                    ? "bg-fox-orange/15 text-fox-orange"
                    : "bg-fox-yellow/30 text-fox-yellow-dark"
                }`}
              >
                {isAccurate ? "认知准确" : isLow ? "低估自己" : "高估自己"}
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-12 text-fox-gray">自评分</span>
                <div className="flex-1">
                  <div className="h-2 w-full rounded-full bg-fox-gray-bg overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${selfScore * 10}%` }}
                      transition={{ duration: 0.6, delay: 0.1 + idx * 0.05 }}
                      className="h-full rounded-full bg-fox-gray"
                    />
                  </div>
                </div>
                <span className="w-10 text-right tabular-nums text-fox-gray">{selfScore}/10</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-12 text-fox-gray">实测分</span>
                <div className="flex-1">
                  <div className="h-2 w-full rounded-full bg-fox-gray-bg overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${actual * 10}%` }}
                      transition={{ duration: 0.6, delay: 0.2 + idx * 0.05 }}
                      className="h-full rounded-full bg-fox-orange"
                    />
                  </div>
                </div>
                <span className="w-10 text-right tabular-nums font-semibold text-fox-orange">{actual}/10</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
