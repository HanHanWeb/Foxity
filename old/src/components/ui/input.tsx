import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, type, ...props }, ref) => (
  <input type={type} className={cn("flex h-11 w-full rounded-xl border border-fox-gray-light bg-white px-4 py-2 text-sm text-fox-navy ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-fox-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fox-orange disabled:cursor-not-allowed disabled:opacity-50", className)} ref={ref} {...props} />
));
Input.displayName = "Input";

export { Input };
