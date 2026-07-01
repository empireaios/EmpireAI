import type { ReactNode } from "react";
import type { CockpitDataMode } from "@/lib/cockpit/kpis/registry";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type CockpitPageHeaderProps = {
  eyebrow: string;
  title: string;
  dataMode: CockpitDataMode;
  actions?: ReactNode;
};

/** Reusable command-surface page header with data mode badge. */
export function CockpitPageHeader({
  eyebrow,
  title,
  dataMode,
  actions,
}: CockpitPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#6f6a60]">
          {eyebrow}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-semibold text-[#f0d78c] sm:text-3xl">
            {title}
          </h1>
          <DataModeBadge mode={dataMode} />
        </div>
      </div>
      {actions}
    </div>
  );
}
