"use client";

import Link from "next/link";
import { useExecutiveHome } from "@/lib/cockpit/hooks/useExecutiveHome";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

/** P7-04 — Constitutional executive brief (5-second awareness). */
export function ExecutiveHomeBriefPanel() {
  const { data, loading } = useExecutiveHome();
  const brief = data?.executiveBrief;

  if (loading && !brief) {
    return <div className="h-36 animate-pulse rounded-xl border border-gold/10 bg-white/[0.02]" />;
  }

  if (!brief) return null;

  return (
    <section
      id="executive-brief"
      aria-label="Executive summary"
      className="rounded-xl border border-gold/25 bg-gradient-to-br from-gold/[0.08] via-black/40 to-transparent px-5 py-5"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#d4af37]">
            Executive Summary · P7-04
          </p>
          <h2 className="mt-1 font-display text-2xl text-[#f0d78c]">{brief.overallEmpireStatus}</h2>
          <p className="mt-1 text-sm text-[#c8c0b0]">{brief.currentStrategicObjective}</p>
        </div>
        <DataModeBadge mode="live" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <BriefCell label="Constitutional Phase" value={brief.currentConstitutionalPhase} />
        <BriefCell label="Execution Phase" value={brief.currentExecutionPhase} />
        <BriefCell label="Highest Risk" value={brief.highestPriorityRisk} tone="risk" />
        <BriefCell label="Top Opportunity" value={brief.highestPriorityOpportunity} tone="opportunity" />
      </div>

      <div className="mt-4 rounded-lg border border-gold/15 bg-black/30 px-4 py-3">
        <p className="text-[10px] uppercase tracking-wider text-[#6f6a60]">Recommended Next Action</p>
        <p className="mt-1 text-sm font-medium text-[#f0d78c]">{brief.currentRecommendation}</p>
      </div>
    </section>
  );
}

function BriefCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "risk" | "opportunity";
}) {
  const color =
    tone === "risk"
      ? "text-amber-200"
      : tone === "opportunity"
        ? "text-emerald-300"
        : "text-[#c8c0b0]";
  return (
    <div className="rounded-lg border border-gold/10 bg-black/20 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-[#6f6a60]">{label}</p>
      <p className={`mt-1 text-sm ${color}`}>{value}</p>
    </div>
  );
}
