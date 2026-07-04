import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors", {
  variants: {
    variant: {
      default: "bg-fox-orange/10 text-fox-orange",
      navy: "bg-fox-navy text-white",
      mint: "bg-fox-mint/10 text-fox-mint",
      coral: "bg-fox-coral/10 text-fox-coral",
      yellow: "bg-fox-yellow/20 text-fox-navy",
      outline: "border border-fox-navy text-fox-navy",
      gray: "bg-fox-gray-bg text-fox-gray",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
