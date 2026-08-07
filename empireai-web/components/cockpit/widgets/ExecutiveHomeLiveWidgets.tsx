"use client";

import Link from "next/link";
import type { ReactNode } from "react";
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

function WidgetLoadState({
  title,
  loading,
  error,
  hasData,
  onRetry,
  children,
}: {
  title: string;
  loading: boolean;
  error: Error | null;
  hasData: boolean;
  onRetry: () => void;
  children: ReactNode;
}) {
  if (loading && !hasData) {
    return <Panel title={title}>Loading Executive data…</Panel>;
  }
  if (!hasData) {
    return (
      <Panel title={title}>
        <p className="text-sm text-amber-200/90">
          {error?.message
            ? `Unable to load: ${error.message}`
            : "Executive data unavailable."}
        </p>
        <p className="mt-1 text-xs text-[#8a847a]">Affected: {title}. Retry when Brain is ready.</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void onRetry()}>
          Retry
        </button>
      </Panel>
    );
  }
  return (
    <>
      {error && (
        <p className="mb-2 text-xs text-amber-200/80">
          Reconnecting… showing last known good state. {error.message}
        </p>
      )}
      {children}
    </>
  );
}

/** SCR-001 — Live greeting with certification blocker from Brain. */
export function ExecutiveHomeGreetingLive() {
  const { user } = useAuth();
  const { data, loading, error } = useExecutiveHomeData();
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
      {loading && !data ? (
        <div className="rounded-lg border border-gold/15 bg-gold/5 px-4 py-3 text-sm text-[#c8c0b0]">
          Connecting Brain Sync…
        </div>
      ) : error && !data ? (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200/90">
          Executive Home unavailable: {error.message}
        </div>
      ) : topBlocker ? (
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
      ) : data ? (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-200/90">
          No open certification blockers reported.
        </div>
      ) : null}
    </div>
  );
}

/** SCR-001 — Command snapshot from executive-home Brain view. */
export function CommandSnapshotLive() {
  const { data, loading, error, reload } = useExecutiveHomeData();

  return (
    <WidgetLoadState
      title="Command Snapshot"
      loading={loading}
      error={error}
      hasData={Boolean(data)}
      onRetry={reload}
    >
      {data && (
        <Panel title="Command Snapshot" subtitle="Live · cockpit-command aggregate">
          <div className="mb-3">
            <DataModeBadge mode="live" />
          </div>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-[#6f6a60]">Operational readiness</dt>
              <dd className="text-[#e8e0d0]">
                {data.command.operationalReadiness.percent}% —{" "}
                {data.command.operationalReadiness.detail}
              </dd>
            </div>
            <div>
              <dt className="text-[#6f6a60]">Active objective</dt>
              <dd className="text-[#f0d78c]">{data.command.oms.activeObjective}</dd>
            </div>
            <div>
              <dt className="text-[#6f6a60]">PROOF-001</dt>
              <dd className="text-[#e8e0d0]">
                {data.command.proof001.stagesPassed}/{data.command.proof001.totalStages} stages ·{" "}
                {data.command.proof001.detail}
              </dd>
            </div>
            <div>
              <dt className="text-[#6f6a60]">Pending approvals</dt>
              <dd className="text-[#e8e0d0]">
                {data.command.pendingApprovals.count > 0
                  ? data.command.pendingApprovals.count
                  : "No pending approvals."}
              </dd>
            </div>
          </dl>
          <Link href={`${COCKPIT_BASE}/command`} className="mt-4 inline-block text-xs text-[#d4af37]">
            Open Command Centre →
          </Link>
        </Panel>
      )}
    </WidgetLoadState>
  );
}

/** SCR-001 — Mission queue preview from OMS. */
export function MissionQueuePreviewLive() {
  const { data, loading, error, reload } = useExecutiveHomeData();

  return (
    <WidgetLoadState
      title="Mission Queue"
      loading={loading}
      error={error}
      hasData={Boolean(data)}
      onRetry={reload}
    >
      {data && (
        <Panel title="Mission Queue Preview" subtitle="Live · OMS reporting">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[#c8c0b0]">OMS health</span>
              <StatusBadge
                status={data.command.oms.overallHealth === "GREEN" ? "connected" : "pending"}
              />
            </div>
            <p className="text-[#e8e0d0]">
              {data.command.oms.activeObjective || "No approved missions."}
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-[#d4af37]/70"
                style={{ width: `${data.command.oms.progress}%` }}
              />
            </div>
            {data.command.oms.nextHighestImpactAction ? (
              <p className="text-xs text-[#8a847a]">
                Next: {data.command.oms.nextHighestImpactAction}
              </p>
            ) : (
              <p className="text-xs text-[#8a847a]">No pending mission actions.</p>
            )}
          </div>
          <Link href={`${COCKPIT_BASE}/missions`} className="mt-4 inline-block text-xs text-[#d4af37]">
            Open Mission Centre →
          </Link>
        </Panel>
      )}
    </WidgetLoadState>
  );
}

/** SCR-001 — Portfolio pulse from domain dashboard. */
export function PortfolioPulseLive() {
  const { data, loading, error, reload } = useExecutiveHomeData();
  const metrics = data?.portfolio.portfolioMetrics ?? [];
  const companies = data?.portfolio.companies ?? [];

  return (
    <WidgetLoadState
      title="Portfolio Pulse"
      loading={loading}
      error={error}
      hasData={Boolean(data)}
      onRetry={reload}
    >
      {data && (
        <Panel title="Portfolio Pulse" subtitle="Live · dashboard domain store">
          {metrics.length === 0 ? (
            <p className="text-sm text-[#8a847a]">No revenue recorded yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {metrics.slice(0, 4).map((m) => (
                <div key={m.label} className="rounded-lg border border-gold/10 px-3 py-2">
                  <p className="text-[10px] uppercase text-[#6f6a60]">{m.label}</p>
                  <p className="font-display text-xl text-[#f0d78c]">{m.value}</p>
                </div>
              ))}
            </div>
          )}
          {companies.length === 0 ? (
            <p className="mt-4 text-sm text-[#8a847a]">No published products yet.</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {companies.slice(0, 4).map((c) => (
                <li key={c.id} className="flex justify-between text-[#c8c0b0]">
                  <span>{c.name}</span>
                  <span>{c.revenue}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}
    </WidgetLoadState>
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
  const engines = data?.engineSummaries ?? [];

  return (
    <WidgetLoadState
      title="Engine Health"
      loading={loading}
      error={error}
      hasData={Boolean(data)}
      onRetry={reload}
    >
      {data && (
        <Panel title="V1 Engine Health" subtitle="Live · G4-02 engine centers">
          {engines.length === 0 ? (
            <p className="text-sm text-[#8a847a]">
              Engine summaries unavailable in this view (degraded or empty assembly).
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {engines.map((engine) => (
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
          )}
        </Panel>
      )}
    </WidgetLoadState>
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
