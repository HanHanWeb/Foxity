import { motion } from "framer-motion";

interface InsightCardProps {
  icon: string;
  text: string;
  index?: number;
}

export function InsightCard({ icon, text, index = 0 }: InsightCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
      className="rounded-lg border border-fox-gray-light bg-fox-cream p-3 text-xs text-fox-navy shadow-sm"
    >
      <div className="flex items-start gap-2">
        <span className="text-base leading-none">{icon}</span>
        <span className="leading-relaxed">{text}</span>
      </div>
    </motion.div>
  );
}
