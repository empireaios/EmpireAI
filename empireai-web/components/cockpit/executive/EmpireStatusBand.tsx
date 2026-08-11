"use client";

import { useExecutiveHome } from "@/lib/cockpit/hooks/useExecutiveHome";
import { scrubMachineLanguage } from "@/lib/cockpit/executive/executive-presentation";

type StatusLevel = "Healthy" | "Attention needed" | "Critical";

function deriveStatus(input: {
  pendingApprovals: number;
  hardStop: boolean;
  guardian: string;
  needsGrandKing: boolean;
}): { level: StatusLevel; sentence: string } {
  if (input.hardStop) {
    return {
      level: "Critical",
      sentence: "Cost safeguards have stopped paid autonomous work until limits are configured.",
    };
  }
  if (/fail|critical|red/i.test(input.guardian)) {
    return {
      level: "Critical",
      sentence: "A core operating check needs immediate owner attention.",
    };
  }
  if (input.pendingApprovals > 0 || input.needsGrandKing) {
    return {
      level: "Attention needed",
      sentence: "Pillow has owner decisions waiting — review Needs your attention below.",
    };
  }
  return {
    level: "Healthy",
    sentence: "EmpireAI is operating within authority. No critical owner blocker is open.",
  };
}

/** Above-the-fold EmpireAI status for Grand King — plain language only. */
export function EmpireStatusBand() {
  const { data, loading } = useExecutiveHome();
  const t = data?.canonicalTruth;

  if (loading && !t) {
    return <div className="h-20 animate-pulse rounded-xl border border-gold/10 bg-white/[0.02]" />;
  }
  if (!t) return null;

  const needsGrandKing = Boolean(t.sinceLastVisit?.needsGrandKing || t.pendingApprovals > 0);
  const { level, sentence } = deriveStatus({
    pendingApprovals: t.pendingApprovals,
    hardStop: Boolean(t.costGuard?.hardStopActive),
    guardian: t.guardianStatus ?? "",
    needsGrandKing,
  });

  const tone =
    level === "Healthy"
      ? "border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-100"
      : level === "Critical"
        ? "border-red-500/35 bg-red-500/[0.08] text-red-100"
        : "border-amber-500/35 bg-amber-500/[0.08] text-amber-100";

  return (
    <section
      aria-label="EmpireAI status"
      className={`rounded-xl border px-5 py-4 ${tone}`}
      data-testid="empire-status-band"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] opacity-80">
        EmpireAI status
      </p>
      <p className="mt-1 font-display text-2xl text-[#f0d78c]">{level}</p>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-[#e8e0d0]">
        {scrubMachineLanguage(sentence)}
      </p>
    </section>
  );
}
