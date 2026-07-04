"use client";

import { motion } from "framer-motion";
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { Ability } from "@/types";
import { dimensions } from "@/mock/data";

interface RadarChartProps {
  abilities: Record<string, Ability>;
}

export function RadarChart({ abilities }: RadarChartProps) {
  const data = dimensions.map((dim) => ({
    dimension: dim.shortName,
    score: abilities[dim.key]?.score ?? 0,
    fullMark: 10,
  }));

  return (
    <motion.div
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, type: "spring", stiffness: 120 }}
      className="h-64 w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart data={data} outerRadius="75%">
          <PolarGrid stroke="#E5E5E5" />
          <PolarAngleAxis dataKey="dimension" tick={{ fill: "#2B4C7E", fontSize: 12, fontWeight: 600 }} />
          <PolarRadiusAxis angle={90} domain={[0, 10]} tick={false} axisLine={false} />
          <Radar
            name="能力分数"
            dataKey="score"
            stroke="#FF9F4D"
            fill="#FF9F4D"
            fillOpacity={0.35}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #E5E5E5",
              fontSize: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            }}
            formatter={(value: number) => [`${value}/10`, "分数"]}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
