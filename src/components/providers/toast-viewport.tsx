"use client";

import { useToastStore } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import { Heart, CheckCircle2, AlertCircle } from "lucide-react";

export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto flex max-w-sm items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium shadow-soft-lg animate-fade-up",
            toast.tone === "success" && "border-blush-200 bg-white text-mocha-700",
            toast.tone === "error" && "border-red-200 bg-white text-red-600",
            (!toast.tone || toast.tone === "default") && "border-mocha-700/10 bg-white text-mocha-700"
          )}
        >
          {toast.tone === "success" && <Heart size={14} className="text-blush-400" />}
          {toast.tone === "error" && <AlertCircle size={14} />}
          {(!toast.tone || toast.tone === "default") && <CheckCircle2 size={14} className="text-gold-500" />}
          {toast.message}
        </div>
      ))}
    </div>
  );
}
