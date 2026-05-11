import type { ReactNode } from "react";

export type StatCardProps = {
  label: string;
  value: string;
  accentColor: string;
  icon: ReactNode;
};

export function StatCard({ label, value, accentColor, icon }: StatCardProps) {
  return (
    <div className="relative flex min-w-0 flex-1 basis-0 flex-col justify-between gap-[13px] overflow-hidden rounded-xl border border-zinc-100 bg-white px-5 py-4">
      <div
        className="absolute bottom-0 left-0 top-0 w-[4px] rounded-r-full"
        style={{ backgroundColor: accentColor }}
      />
      <div className="flex min-w-0 items-start justify-between gap-3">
        <span className="min-w-0 text-[13px] text-zinc-400">{label}</span>
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-zinc-100 text-zinc-400">
          {icon}
        </span>
      </div>
      <p className="mt-3 min-w-0 text-[28px] font-bold text-primary-text">
        <span className="block truncate">{value}</span>
      </p>
    </div>
  );
}
