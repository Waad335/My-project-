import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  hint,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "default" | "warning";
  hint?: string;
}) {
  return (
    <div className="card-surface flex items-center gap-4 p-5">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-full ${
          tone === "warning" ? "bg-red-50 text-red-500" : "bg-blush-100 text-blush-500"
        }`}
      >
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-mocha-400">{label}</p>
        <p className="font-heading text-xl text-mocha-700">{value}</p>
        {hint && <p className="mt-0.5 text-[11px] text-mocha-400">{hint}</p>}
      </div>
    </div>
  );
}
