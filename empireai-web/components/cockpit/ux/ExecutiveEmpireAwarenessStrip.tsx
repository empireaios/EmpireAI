"use client";

import Link from "next/link";
import { useExecutiveHome } from "@/lib/cockpit/hooks/useExecutiveHome";
import { useFounderShell } from "@/lib/founder-shell/FounderShellProvider";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { COCKPIT_UX_NAVIGATION } from "@/lib/cockpit-ux/navigation";

function statusTone(value: string): string {
  const lower = value.toLowerCase();
  if (/healthy|ready|green|complete|running|ok/i.test(lower)) {
    return "text-emerald-300";
  }
  if (/warn|pending|busy|yellow/i.test(lower)) {
    return "text-amber-200";
  }
  if (/fail|error|red|blocked/i.test(lower)) {
    return "text-red-300";
  }
  return "text-[#c8c0b0]";
}

/**
 * P7-02 — One-screen executive awareness.
 * Grand King understands Empire state within seconds.
 */
export function ExecutiveEmpireAwarenessStrip() {
  const { data, loading } = useExecutiveHome();
  const { data: founderData } = useFounderShell();
  const founder = founderData?.founderShellEngine.cockpit.executiveHome;
  const context = founderData?.founderShellEngine.cockpit.context;

  const empireHealth = data?.summaryCards.find((c) => c.id === "empire-health");
  const revenue = data?.summaryCards.find((c) => c.id === "revenue-today");
  const activeMissions = data?.summaryCards.find((c) => c.id === "active-missions");
  const aiRecCard = data?.summaryCards.find((c) => c.id === "ai-recommendations");
  const pillowRecs =
    founder?.recommendations ?? (aiRecCard?.nextAction ? [aiRecCard.nextAction] : []);

  if (loading && !data && !founder) {
    return (
      <div className="h-28 animate-pulse rounded-xl border border-gold/10 bg-white/[0.02]" />
    );
  }

  const metrics = [
    {
      label: "Empire Health",
      value: empireHealth?.primaryValue ?? founder?.businessStatus ?? "—",
      href: COCKPIT_UX_NAVIGATION.find((n) => n.id === "executive_home")?.href,
    },
    {
      label: "Current Mission",
      value:
        data?.canonicalTruth?.activeMissionHuman ??
        context?.currentMission ??
        founder?.missionStatus ??
        activeMissions?.primaryValue ??
        "No active mission",
      href: COCKPIT_UX_NAVIGATION.find((n) => n.id === "mission_centre")?.href,
    },
    {
      label: "Roadmap",
      value: founder?.currentJourney ?? context?.currentJourney ?? "—",
      href: COCKPIT_UX_NAVIGATION.find((n) => n.id === "journey")?.href,
    },
    {
      label: "Progress",
      value: data?.command.oms.progress != null ? `${data.command.oms.progress}%` : "—",
      href: COCKPIT_UX_NAVIGATION.find((n) => n.id === "mission_centre")?.href,
    },
    {
      label: "Builder",
      value: founder?.builderStatus ?? "—",
      href: COCKPIT_UX_NAVIGATION.find((n) => n.id === "builder")?.href,
    },
    {
      label: "Supervisor",
      value: founder?.supervisorStatus ?? "—",
      href: COCKPIT_UX_NAVIGATION.find((n) => n.id === "supervisor")?.href,
    },
    {
      label: "Guardian",
      value: data?.canonicalTruth?.guardianStatus ?? founderData?.founderShellEngine.cockpit.shellHealth ?? "—",
      href: COCKPIT_UX_NAVIGATION.find((n) => n.id === "guardian")?.href,
    },
    {
      label: "Production",
      value: data?.canonicalTruth?.productionStatus ?? founder?.productionStatus ?? "—",
      href: COCKPIT_UX_NAVIGATION.find((n) => n.id === "production")?.href,
    },
    {
      label: "Revenue",
      value:
        data?.canonicalTruth?.realisedRevenueUsd != null
          ? `$${data.canonicalTruth.realisedRevenueUsd.toFixed(2)}`
          : "No realised revenue yet",
      href: COCKPIT_UX_NAVIGATION.find((n) => n.id === "commerce")?.href,
    },
    {
      label: "Business",
      value: context?.currentBusiness ?? founder?.businessStatus ?? "—",
      href: COCKPIT_UX_NAVIGATION.find((n) => n.id === "business")?.href,
    },
    {
      label: "Alerts",
      value: String(founder?.alerts?.length ?? data?.attentionItems.length ?? 0),
      href: "#executive-alerts",
    },
    {
      label: "Approvals",
      value: String(
        data?.canonicalTruth?.pendingApprovals ?? data?.command.pendingApprovals.count ?? 0,
      ),
      href: COCKPIT_UX_NAVIGATION.find((n) => n.id === "executive_home")?.href,
    },
  ];

  return (
    <section
      id="empire-awareness"
      aria-label="Empire awareness"
      className="rounded-xl border border-gold/20 bg-gradient-to-br from-gold/[0.06] via-transparent to-transparent px-4 py-4"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#d4af37]">
            Empire Awareness · P7-02
          </p>
          <p className="mt-0.5 text-xs text-[#8a847a]">
            {founderData?.founderShellEngine.cockpit.grandKingSummary ??
              "Executive operating system — live status across all centres"}
          </p>
        </div>
        <DataModeBadge mode="live" />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {metrics.map((metric) => (
          <Link
            key={metric.label}
            href={metric.href ?? "#"}
            className="rounded-lg border border-gold/10 bg-black/20 px-3 py-2 transition hover:border-gold/25"
          >
            <p className="text-[10px] uppercase tracking-wider text-[#6f6a60]">{metric.label}</p>
            <p className={`mt-0.5 truncate text-sm font-medium ${statusTone(String(metric.value))}`}>
              {metric.value}
            </p>
          </Link>
        ))}
      </div>

      {pillowRecs.length > 0 && (
        <div className="mt-3 border-t border-gold/10 pt-3">
          <p className="text-[10px] uppercase text-[#6f6a60]">Pillow Recommendations</p>
          <ul className="mt-1 space-y-1 text-xs text-[#c8c0b0]">
            {pillowRecs.map((rec) => (
              <li key={rec}>◆ {rec}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
