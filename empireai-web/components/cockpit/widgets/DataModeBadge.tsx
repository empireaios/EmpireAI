import type { CockpitDataMode } from "@/lib/cockpit/kpis/registry";

const modeStyles: Record<CockpitDataMode, string> = {
  live: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
  demo: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  sandbox: "border-sky-500/25 bg-sky-500/10 text-sky-300",
};

const modeLabels: Record<CockpitDataMode, string> = {
  live: "Live",
  demo: "Demo",
  sandbox: "Sandbox",
};

type DataModeBadgeProps = {
  mode: CockpitDataMode;
  className?: string;
};

/** Displays Cockpit data mode — Live, Demo, or Sandbox. */
export function DataModeBadge({ mode, className = "" }: DataModeBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${modeStyles[mode]} ${className}`}
    >
      {modeLabels[mode]}
    </span>
  );
}
