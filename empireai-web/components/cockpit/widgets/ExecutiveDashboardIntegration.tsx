"use client";

import Link from "next/link";
import { Panel } from "@/components/platform/ui/PlatformPrimitives";
import { useExecutiveHome } from "@/lib/cockpit/hooks/useExecutiveHome";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { engineCenterHref } from "@/lib/cockpit/engine-centers";

/** G4-05 — V1 engine dependency graph. */
export function ExecutiveDependencyGraphPanel() {
  const { data, loading } = useExecutiveHome();
  if (loading || !data?.dependencyGraph) return null;

  const { nodes, edges } = data.dependencyGraph;

  return (
    <Panel title="Executive Dependency Graph" subtitle="V1 commercial spine · G4-05">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <DataModeBadge mode="live" />
        <Link
          href="/cockpit/relationship"
          className="text-[10px] text-[#d4af37] hover:underline"
        >
          View full relationship graph →
        </Link>
      </div>
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {nodes.map((node) => (
          <Link
            key={node.engineId}
            href={node.route}
            className="rounded-lg border border-gold/10 px-3 py-2 transition hover:border-gold/25"
          >
            <div className="flex items-center justify-between gap-1">
              <p className="text-[10px] font-medium text-[#c8c0b0]">{node.displayName}</p>
              <StatusBadge
                status={
                  node.health === "HEALTHY"
                    ? "connected"
                    : node.health === "FAILED"
                      ? "blocked"
                      : "pending"
                }
              />
            </div>
          </Link>
        ))}
      </div>
      <ul className="mt-4 space-y-1.5 text-xs text-[#8a847a]">
        {edges.map((edge) => (
          <li key={`${edge.from}-${edge.to}`}>
            <Link href={engineCenterHref(edge.from)} className="text-[#d4af37]">
              {edge.from}
            </Link>
            {" → "}
            <Link href={engineCenterHref(edge.to)} className="text-[#d4af37]">
              {edge.to}
            </Link>
            <span className="text-[#6f6a60]"> · {edge.label}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/** G4-05 — Aggregated executive timeline from all engines. */
export function ExecutiveTimelinePanel() {
  const { data, loading, error, reload } = useExecutiveHome();
  if (loading) {
    return <Panel title="Executive Timeline">Loading integrated timeline…</Panel>;
  }
  if (error || !data) {
    return (
      <Panel title="Executive Timeline">
        <button type="button" className="text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <Panel title="Executive Timeline" subtitle="Pillow · Marketplace · Supplier · Storefront · Ads · Payment · Logistics · Analytics">
      <div id="executive-timeline" className="mb-3">
        <DataModeBadge mode="live" />
      </div>
      {data.executiveTimeline.length === 0 ? (
        <p className="text-sm text-[#6f6a60]">No timeline events from engine sources.</p>
      ) : (
        <ul className="max-h-80 space-y-2 overflow-y-auto text-sm">
          {data.executiveTimeline.map((event) => (
            <li
              key={event.id}
              className="rounded-lg border border-gold/10 px-3 py-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] uppercase text-[#6f6a60]">{event.sourceLabel}</span>
                <span className="text-[10px] text-[#6f6a60]">{event.timestamp}</span>
              </div>
              <Link href={event.href} className="font-medium text-[#f0d78c] hover:underline">
                {event.title}
              </Link>
              <p className="text-xs text-[#8a847a]">{event.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/** G4-05 — Approval routing to workflows. */
export function ExecutiveApprovalRoutingPanel() {
  const { data, loading } = useExecutiveHome();
  if (loading || !data) return null;

  if (data.approvalRoutes.length === 0) {
    return (
      <Panel title="King's Approvals" subtitle="No pending approval workflows">
        <p className="text-sm text-[#6f6a60]">Portfolio fully authorized.</p>
      </Panel>
    );
  }

  return (
    <Panel title="King's Approvals" subtitle="Direct workflow routing · G4-05">
      <ul className="space-y-2 text-sm">
        {data.approvalRoutes.map((route) => (
          <li
            key={route.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gold/10 px-3 py-2"
          >
            <div>
              <p className="text-[#f0d78c]">{route.title}</p>
              <p className="text-xs text-[#8a847a]">{route.summary}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              {route.engineId && (
                <Link
                  href={engineCenterHref(route.engineId)}
                  className="rounded border border-gold/15 px-2 py-1 text-[10px] text-[#8a847a]"
                >
                  Engine
                </Link>
              )}
              <Link
                href={route.workflowHref}
                className="rounded border border-gold/25 bg-gold/10 px-2 py-1 text-[10px] text-[#d4af37]"
              >
                Open workflow →
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/** G4-05 — Alert list with engine center routing. */
export function ExecutiveAlertsPanel() {
  const { data, loading } = useExecutiveHome();
  if (loading || !data) return null;

  return (
    <div id="executive-alerts">
      <Panel title="Executive Alerts" subtitle="Routed to affected Engine Centers">
        <div className="mb-3">
          <DataModeBadge mode="live" />
        </div>
        {data.executiveAlerts.length === 0 ? (
          <p className="text-sm text-emerald-200/80">No open alerts.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.executiveAlerts.map((alert) => (
              <li
                key={alert.id}
                className="rounded-lg border border-gold/10 px-3 py-2"
              >
                <Link href={alert.href} className="text-[#e8e0d0] hover:text-[#f0d78c]">
                  {alert.label} →
                </Link>
                {alert.engineId && (
                  <p className="mt-1 text-[10px] text-[#6f6a60]">
                    Engine:{" "}
                    <Link href={engineCenterHref(alert.engineId)} className="text-[#d4af37]">
                      {alert.engineId}
                    </Link>
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
