"use client";

import { useToastStore } from "@/lib/toast";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

const variantConfig = {
  success: { icon: CheckCircle2, className: "border-green-200 bg-green-50 text-green-800" },
  error: { icon: XCircle, className: "border-red-200 bg-red-50 text-red-800" },
  warning: { icon: AlertTriangle, className: "border-amber-200 bg-amber-50 text-amber-800" },
  default: { icon: Info, className: "border-fox-gray-light bg-white text-fox-navy" },
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => {
        const config = variantConfig[t.variant];
        const Icon = config.icon;
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-2 rounded-lg border px-4 py-3 shadow-md ${config.className}`}
            style={{ minWidth: 280, maxWidth: 400 }}
          >
            <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.description && <p className="mt-0.5 text-xs opacity-80">{t.description}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="flex-shrink-0 opacity-50 transition hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
