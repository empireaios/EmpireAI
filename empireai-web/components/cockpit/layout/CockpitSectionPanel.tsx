import type { ReactNode } from "react";

type CockpitSectionPanelProps = {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * G4-10 — Section panel chrome (uppercase title style).
 * Distinct from ui/CockpitPanel which re-exports platform Panel.
 */
export function CockpitSectionPanel({
  title,
  action,
  children,
  className = "",
}: CockpitSectionPanelProps) {
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

/** @deprecated Use CockpitSectionPanel — layout alias retained for imports. */
export const CockpitPanel = CockpitSectionPanel;
