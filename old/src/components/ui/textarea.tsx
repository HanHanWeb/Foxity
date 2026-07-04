import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea className={cn("flex min-h-[88px] w-full rounded-xl border border-fox-gray-light bg-white px-4 py-3 text-sm text-fox-navy ring-offset-background placeholder:text-fox-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fox-orange disabled:cursor-not-allowed disabled:opacity-50", className)} ref={ref} {...props} />
));
Textarea.displayName = "Textarea";

export { Textarea };
