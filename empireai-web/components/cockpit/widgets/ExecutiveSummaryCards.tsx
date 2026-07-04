"use client";

import Link from "next/link";
import { useExecutiveHome } from "@/lib/cockpit/hooks/useExecutiveHome";
import { EXECUTIVE_PRIORITY_WIDGETS } from "@/lib/cockpit/executive-widgets";
import { engineCenterHref } from "@/lib/cockpit/engine-centers";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { CockpitExplainButton } from "@/components/cockpit/interaction/CockpitInteractionDrawer";
import { ExecutiveLiveWidgetFrame } from "@/components/cockpit/widgets/ExecutiveLiveWidgetFrame";
import type { ExecutiveHomeView } from "@/lib/cockpit/panel-types";

function severityBorder(severity: ExecutiveHomeView["attentionItems"][number]["severity"]) {
  if (severity === "critical") return "border-red-500/30 bg-red-500/5";
  if (severity === "warning") return "border-amber-500/30 bg-amber-500/5";
  return "border-gold/15 bg-white/[0.02]";
}

function formatLastUpdated(iso: string | null) {
  if (!iso) return "Awaiting first load…";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(iso));
}

/** G4-06 — Brain sync status for Executive Home. */
export function ExecutiveHomeSyncBar() {
  const { loading, refreshing, lastUpdatedAt, refreshMs, reload } = useExecutiveHome();
  const isInitialLoad = loading && !lastUpdatedAt;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gold/10 bg-white/[0.02] px-4 py-2 text-xs text-[#8a847a]">
      <span>
        Brain sync ·{" "}
        {isInitialLoad ? "Connecting…" : refreshing ? "Refreshing…" : `Updated ${formatLastUpdated(lastUpdatedAt)}`}
      </span>
      <div className="flex items-center gap-3">
        <span>Auto-refresh {Math.round(refreshMs / 1000)}s</span>
        <DataModeBadge mode="live" />
        <button type="button" className="text-[#d4af37] hover:underline" onClick={() => reload()}>
          Refresh now
        </button>
      </div>
    </div>
  );
}

/** G4-03 / G4-06 — What requires my attention? */
export function ExecutiveAttentionStrip() {
  const { data, loading } = useExecutiveHome();
  if (loading && !data) {
    return (
      <div className="space-y-2">
        <div className="h-3 w-40 animate-pulse rounded bg-white/[0.04]" />
        <div className="h-12 animate-pulse rounded-lg border border-gold/10 bg-white/[0.02]" />
        <div className="h-12 animate-pulse rounded-lg border border-gold/10 bg-white/[0.02]" />
      </div>
    );
  }

  if (!data || data.attentionItems.length === 0) {
    return (
      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-200/90">
        Nothing requires immediate attention — all certification gates and approvals clear.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6f6a60]">
        Requires your attention ({data.attentionItems.length})
      </p>
      <ul className="space-y-2">
        {data.attentionItems.map((item) => (
          <li
            key={item.id}
            className={`rounded-lg border px-4 py-2.5 text-sm ${severityBorder(item.severity)}`}
          >
            {item.href ? (
              <Link href={item.href} className="text-[#e8e0d0] hover:text-[#f0d78c]">
                {item.label}
                {item.engineId ? (
                  <span className="ml-2 text-[10px] text-[#d4af37]">→ {item.engineId}</span>
                ) : (
                  " →"
                )}
              </Link>
            ) : (
              <span className="text-[#e8e0d0]">{item.label}</span>
            )}
            <CockpitExplainButton
              label={item.label}
              targetId={item.id}
              className="ml-2 inline"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** G4-03 / G4-06 — What should I do next? */
export function ExecutiveNextActionStrip() {
  const { data, loading } = useExecutiveHome();
  if (loading && !data) return null;
  if (!data) return null;

  return (
    <div className="rounded-xl border border-gold/20 bg-gradient-to-r from-gold/10 via-transparent to-transparent px-5 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d4af37]">
        Next executive action
      </p>
      <p className="mt-2 font-display text-lg text-[#f0d78c]">{data.nextExecutiveAction}</p>
      <div className="mt-2">
        <DataModeBadge mode="live" />
      </div>
    </div>
  );
}

/** G4-06 — Priority live executive widget grid (10 widgets). */
export function ExecutivePriorityWidgetGrid() {
  const { data, loading, error, reload } = useExecutiveHome();

  if (loading && !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {EXECUTIVE_PRIORITY_WIDGETS.map((widget) => (
          <div
            key={widget.widgetId}
            className="h-44 animate-pulse rounded-xl border border-gold/10 bg-white/[0.02]"
          />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <button type="button" className="text-sm text-[#d4af37]" onClick={() => reload()}>
        Retry loading executive widgets
      </button>
    );
  }

  const cardById = new Map(data.summaryCards.map((card) => [card.id, card]));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6f6a60]">
          Live Executive Widgets · {EXECUTIVE_PRIORITY_WIDGETS.length}
        </p>
        <DataModeBadge mode="live" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {EXECUTIVE_PRIORITY_WIDGETS.map((widget) => {
          const card = cardById.get(widget.cardId);
          if (!card) return null;
          return <ExecutiveLiveWidgetFrame key={widget.widgetId} card={card} />;
        })}
      </div>
    </div>
  );
}

/** G4-03 alias — summary card grid uses priority widgets. */
export const ExecutiveSummaryCardGrid = ExecutivePriorityWidgetGrid;

/** G4-03 / G4-06 — V1 engine health strip. */
export function ExecutiveEngineHealthStrip() {
  const { data, loading } = useExecutiveHome();
  if (loading && !data) return null;
  if (!data) return null;

  const healthy = data.engineSummaries.filter((e) => e.health === "HEALTHY").length;

  return (
    <div className="rounded-xl border border-gold/10 bg-white/[0.02] px-4 py-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6f6a60]">
          V1 Engine Health · {healthy}/{data.engineSummaries.length} healthy
        </p>
        <Link href="/cockpit/intelligence/suppliers" className="text-xs text-[#d4af37]">
          All engine centers →
        </Link>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {data.engineSummaries.map((engine) => (
          <Link
            key={engine.engineId}
            href={engineCenterHref(engine.engineId)}
            className="rounded-lg border border-gold/10 px-3 py-2 transition hover:border-gold/25"
          >
            <div className="flex items-center justify-between gap-1">
              <p className="truncate text-[10px] font-medium text-[#c8c0b0]">{engine.displayName}</p>
              <StatusBadge
                status={
                  engine.health === "HEALTHY"
                    ? "connected"
                    : engine.health === "FAILED"
                      ? "blocked"
                      : "pending"
                }
              />
            </div>
            <p className="mt-1 text-[10px] text-[#6f6a60]">{engine.progress.percent}%</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
