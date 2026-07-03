"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/context";
import { resolveExecutiveDisplayName } from "@/lib/auth/display";
import { useExecutiveHomeOptional } from "@/lib/cockpit/hooks/useExecutiveHome";
import { useBrainModule } from "@/lib/brain/hooks/useBrainModule";
import { Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import type { ExecutiveHomeView } from "@/lib/cockpit/panel-types";
import {
  EXECUTIVE_HOME_KPI_STRIP_IDS,
  getCockpitKpisByIds,
} from "@/lib/cockpit/kpis/registry";
import { resolveKpiDisplayValue } from "@/lib/cockpit/kpis/resolve-kpi-values";
import { useLedgerKpiValues } from "@/lib/cockpit/kpis/useLedgerKpiValues";
import { COCKPIT_BASE } from "@/lib/cockpit/types";

function useExecutiveHomeData() {
  const shared = useExecutiveHomeOptional();
  const fallback = useBrainModule<ExecutiveHomeView>("executive-home", "load", {
    enabled: shared === null,
  });
  if (shared) {
    return {
      data: shared.data,
      loading: shared.loading,
      error: shared.error,
      reload: shared.reload,
    };
  }
  return {
    data: fallback.data,
    loading: fallback.loading,
    error: fallback.error ? new Error(fallback.error.message) : null,
    reload: fallback.reload,
  };
}

/** SCR-001 — Live greeting with certification blocker from Brain. */
export function ExecutiveHomeGreetingLive() {
  const { user } = useAuth();
  const { data } = useExecutiveHomeData();
  const displayName = resolveExecutiveDisplayName(user);
  const sessionLabel =
    user?.platformIdentity === "grand-king" ? "Grand King session" : "Sovereign session";
  const today = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date());

  const topBlocker = data?.greeting.topBlocker;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[#f0d78c] sm:text-3xl">
          Good morning, {displayName}
        </h1>
        <p className="mt-1 text-sm text-[#8a847a]">{today} · {sessionLabel}</p>
      </div>
      {topBlocker ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <p className="text-sm text-amber-200/90">⚠ {topBlocker}</p>
          {data?.greeting.topBlockerHref && (
            <Link
              href={data.greeting.topBlockerHref}
              className="shrink-0 rounded-md border border-gold/15 px-3 py-1 text-xs text-[#d4af37]"
            >
              Resolve
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-200/90">
          All certification blockers closed — monitor PROOF-001 on Finance → Profit
        </div>
      )}
    </div>
  );
}

/** SCR-001 — Command snapshot from executive-home Brain view. */
export function CommandSnapshotLive() {
  const { data, loading, error, reload } = useExecutiveHomeData();

  if (loading) {
    return <Panel title="Command Snapshot">Loading…</Panel>;
  }
  if (error || !data) {
    return (
      <Panel title="Command Snapshot">
        <button type="button" className="text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  const { command } = data;
  return (
    <Panel title="Command Snapshot" subtitle="Live · cockpit-command aggregate">
      <div className="mb-3">
        <DataModeBadge mode="live" />
      </div>
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-[#6f6a60]">Operational readiness</dt>
          <dd className="text-[#e8e0d0]">
            {command.operationalReadiness.percent}% — {command.operationalReadiness.detail}
          </dd>
        </div>
        <div>
          <dt className="text-[#6f6a60]">Active objective</dt>
          <dd className="text-[#f0d78c]">{command.oms.activeObjective}</dd>
        </div>
        <div>
          <dt className="text-[#6f6a60]">PROOF-001</dt>
          <dd className="text-[#e8e0d0]">
            {command.proof001.stagesPassed}/{command.proof001.totalStages} stages ·{" "}
            {command.proof001.detail}
          </dd>
        </div>
        <div>
          <dt className="text-[#6f6a60]">Pending approvals</dt>
          <dd className="text-[#e8e0d0]">{command.pendingApprovals.count}</dd>
        </div>
      </dl>
      <Link href={`${COCKPIT_BASE}/command`} className="mt-4 inline-block text-xs text-[#d4af37]">
        Open Command Centre →
      </Link>
    </Panel>
  );
}

/** SCR-001 — Mission queue preview from OMS. */
export function MissionQueuePreviewLive() {
  const { data, loading, error, reload } = useExecutiveHomeData();

  if (loading) {
    return <Panel title="Mission Queue">Loading…</Panel>;
  }
  if (error || !data) {
    return (
      <Panel title="Mission Queue">
        <button type="button" className="text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <Panel title="Mission Queue Preview" subtitle="Live · OMS reporting">
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-[#c8c0b0]">OMS health</span>
          <StatusBadge status={data.command.oms.overallHealth === "GREEN" ? "connected" : "pending"} />
        </div>
        <p className="text-[#e8e0d0]">{data.command.oms.activeObjective}</p>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-[#d4af37]/70"
            style={{ width: `${data.command.oms.progress}%` }}
          />
        </div>
        {data.command.oms.nextHighestImpactAction && (
          <p className="text-xs text-[#8a847a]">Next: {data.command.oms.nextHighestImpactAction}</p>
        )}
      </div>
      <Link href={`${COCKPIT_BASE}/missions`} className="mt-4 inline-block text-xs text-[#d4af37]">
        Open Mission Centre →
      </Link>
    </Panel>
  );
}

/** SCR-001 — Portfolio pulse from domain dashboard. */
export function PortfolioPulseLive() {
  const { data, loading, error, reload } = useExecutiveHomeData();

  if (loading) {
    return <Panel title="Portfolio Pulse">Loading…</Panel>;
  }
  if (error || !data) {
    return (
      <Panel title="Portfolio Pulse">
        <button type="button" className="text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <Panel title="Portfolio Pulse" subtitle="Live · dashboard domain store">
      <div className="grid gap-3 sm:grid-cols-2">
        {data.portfolio.portfolioMetrics.slice(0, 4).map((m) => (
          <div key={m.label} className="rounded-lg border border-gold/10 px-3 py-2">
            <p className="text-[10px] uppercase text-[#6f6a60]">{m.label}</p>
            <p className="font-display text-xl text-[#f0d78c]">{m.value}</p>
          </div>
        ))}
      </div>
      <ul className="mt-4 space-y-2 text-sm">
        {data.portfolio.companies.slice(0, 4).map((c) => (
          <li key={c.id} className="flex justify-between text-[#c8c0b0]">
            <span>{c.name}</span>
            <span>{c.revenue}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/** SCR-001 — Recent agent activity from domain store. */
export function AgentActivityLive() {
  const { data, loading, error, reload } = useExecutiveHomeData();

  if (loading) {
    return <Panel title="Agent Activity">Loading…</Panel>;
  }
  if (error || !data) {
    return (
      <Panel title="Agent Activity">
        <button type="button" className="text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  const activity = data.portfolio.recentActivity;
  if (activity.length === 0) {
    return (
      <Panel title="Agent Activity" subtitle="Live · no recent activity in domain store">
        <p className="text-sm text-[#6f6a60]">No recent agent activity recorded.</p>
      </Panel>
    );
  }

  return (
    <Panel title="Agent Activity" subtitle="Live · activity repository">
      <ul className="space-y-2 text-sm">
        {activity.map((item) => (
          <li key={item.id} className="rounded-lg border border-gold/10 px-3 py-2">
            <p className="text-[#f0d78c]">{item.agent}</p>
            <p className="text-[#8a847a]">{item.action}</p>
            <p className="text-xs text-[#6f6a60]">{item.timestamp}</p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/** SCR-001 — Engine health row from live engine summaries. */
export function DepartmentHealthRowLive() {
  const { data, loading, error, reload } = useExecutiveHomeData();

  if (loading) {
    return <Panel title="Engine Health">Loading…</Panel>;
  }
  if (error || !data) {
    return (
      <Panel title="Engine Health">
        <button type="button" className="text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <Panel title="V1 Engine Health" subtitle="Live · G4-02 engine centers">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {data.engineSummaries.map((engine) => (
          <div key={engine.engineId} className="rounded-lg border border-gold/10 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-[#c8c0b0]">{engine.displayName}</p>
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
          </div>
        ))}
      </div>
    </Panel>
  );
}

function KpiCard({
  kpi,
  ledgerMetrics,
  loading,
}: {
  kpi: ReturnType<typeof getCockpitKpisByIds>[number];
  ledgerMetrics: ReturnType<typeof useLedgerKpiValues>["metrics"];
  loading: boolean;
}) {
  const { value, trend } = resolveKpiDisplayValue(kpi, ledgerMetrics);
  return (
    <div className="rounded-xl border border-gold/10 bg-white/[0.02] px-4 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6f6a60]">
        {kpi.label}
      </p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-display text-2xl text-[#f0d78c]">
          {loading && ledgerMetrics.length === 0 ? "…" : value}
        </span>
        {trend && <span className="text-sm text-emerald-400">{trend}</span>}
      </div>
      <div className="mt-2">
        <DataModeBadge mode={kpi.dataMode} />
      </div>
    </div>
  );
}

/** SCR-001 — KPI strip (ledger + dashboard). */
export function ExecutiveHomeKpiStrip() {
  const kpis = getCockpitKpisByIds(EXECUTIVE_HOME_KPI_STRIP_IDS);
  const { metrics, loading } = useLedgerKpiValues();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} ledgerMetrics={metrics} loading={loading} />
      ))}
    </div>
  );
}

/** SCR-001 — PROOF-001 tracker strip. */
export function Proof001TrackerLive() {
  const { data, loading } = useExecutiveHomeData();
  if (loading || !data) return null;

  const { proof001 } = data.command;
  return (
    <Panel title="PROOF-001 Tracker" subtitle="Live · first revenue validation">
      <div className="flex flex-wrap items-center gap-4">
        <span className="font-display text-3xl text-[#f0d78c]">{proof001.progressPercent}%</span>
        <div className="flex-1">
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-emerald-500/70"
              style={{ width: `${proof001.progressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-[#8a847a]">{proof001.detail}</p>
        </div>
        <Link href={`${COCKPIT_BASE}/finance/profit`} className="text-xs text-[#d4af37]">
          Revenue Center →
        </Link>
      </div>
    </Panel>
  );
}
