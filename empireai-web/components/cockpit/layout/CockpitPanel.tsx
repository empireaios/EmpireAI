import type { ReactNode } from "react";

type CockpitPanelProps = {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Shared panel chrome for Cockpit page compositions. */
export function CockpitPanel({ title, action, children, className = "" }: CockpitPanelProps) {
  return (
    <section
      className={`rounded-xl border border-gold/10 bg-white/[0.02] p-5 ${className}`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d4af37]">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
