import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type TagTone = "orange" | "navy" | "mint" | "coral" | "yellow" | "gray";

interface TagProps {
  label: string;
  tone?: TagTone;
  className?: string;
}

const toneMap: Record<TagTone, string> = {
  orange: "bg-fox-orange/10 text-fox-orange",
  navy: "bg-fox-navy text-white",
  mint: "bg-fox-mint/15 text-fox-mint",
  coral: "bg-fox-coral/15 text-fox-coral",
  yellow: "bg-fox-yellow/20 text-fox-navy",
  gray: "bg-fox-gray-bg text-fox-gray",
};

export function Tag({ label, tone = "orange", className }: TagProps) {
  return <Badge className={cn("font-medium", toneMap[tone], className)}>{label}</Badge>;
}
