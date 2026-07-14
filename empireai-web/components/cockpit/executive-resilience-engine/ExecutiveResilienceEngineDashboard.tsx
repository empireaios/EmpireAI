"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useExecutiveResilienceEngine } from "@/lib/executive-resilience-engine/useExecutiveResilienceEngine";

/** Compact Executive Resilience Engine strip for Executive Home. */
export function ExecutiveResilienceEngineStrip() {
  const { view, loading, live } = useExecutiveResilienceEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Executive Resilience Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-teal-500/40 bg-gradient-to-r from-teal-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E5-14 Resilience</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/executive-resilience-engine" className="text-xs text-[#d4af37] hover:underline">
          Resilience panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Enterprise Health</p>
          <p className="text-sm text-[#d4af37]">{view.enterpriseHealthScore}/100</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Active Incidents</p>
          <p className="text-sm text-teal-300">{view.activeIncidentCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Recovery Readiness</p>
          <p className="text-sm text-[#e8e0d0]">{view.recoveryReadinessScore}/100</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Resilience Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.resilienceHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E5-14 — Permanent Executive Resilience Engine panel. */
export function ExecutiveResilienceEngineDashboard() {
  const { view, loading, error, reload, live, data } = useExecutiveResilienceEngine();

  if (loading && !view) {
    return <Panel title="Executive Resilience Engine">Loading executive resilience engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Executive Resilience Engine" subtitle="E5-14 · Executive Resilience">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-teal-500/50 bg-gradient-to-br from-teal-500/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E5-14 Executive Resilience Engine</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE515 && (
            <Link href="/cockpit/founder/grand-king-executive-cockpit" className="text-xs text-[#d4af37] hover:underline">
              Ready for E5-15 →
            </Link>
          )}
          <Link href="/cockpit/founder/enterprise-constitutional-guardian" className="text-xs text-[#d4af37] hover:underline">
            E5-13 Constitutional Guardian →
          </Link>
          <Link href="/cockpit/founder/executive-trust-engine" className="text-xs text-[#d4af37] hover:underline">
            E5-12 Trust Engine →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Enterprise Health" value={`${view.enterpriseHealthScore}/100`} />
        <StatCard label="Active Incidents" value={String(view.activeIncidentCount)} />
        <StatCard label="Recovered" value={String(view.recoveredIncidentCount)} />
        <StatCard label="Resilience Health" value={view.resilienceHealth} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Operational Readiness" value={`${view.operationalReadinessScore}/100`} />
        <StatCard label="Recovery Readiness" value={`${view.recoveryReadinessScore}/100`} />
        <StatCard label="Vision Alignment" value={view.visionAlignment} />
      </div>

      <Panel title="Enterprise Health">
        <DataTable
          columns={[
            { key: "domain", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.enterpriseHealth}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Continuity Status">
          <DataTable
            columns={[
              { key: "label", header: "Domain" },
              { key: "availability", header: "Availability" },
              { key: "status", header: "Status" },
            ]}
            rows={view.continuityStatus}
          />
        </Panel>

        <Panel title="Active Incidents">
          <DataTable
            columns={[
              { key: "incidentTitle", header: "Incident" },
              { key: "severity", header: "Severity" },
              { key: "recoveryStatus", header: "Status" },
              { key: "affectedSystems", header: "Systems" },
            ]}
            rows={view.activeIncidents}
          />
        </Panel>
      </div>

      <Panel title="Recovery Progress">
        <DataTable
          columns={[
            { key: "incidentTitle", header: "Incident" },
            { key: "recoveryStrategy", header: "Strategy" },
            { key: "progress", header: "Progress" },
            { key: "recoveryTime", header: "Recovery Time" },
          ]}
          rows={view.recoveryProgress}
        />
      </Panel>

      <Panel title="Operational Readiness">
        <DataTable
          columns={[
            { key: "domain", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.operationalReadiness}
        />
      </Panel>

      <Panel title="Resilience Incident Register">
        <DataTable
          columns={[
            { key: "incidentTitle", header: "Incident" },
            { key: "incidentCategory", header: "Category" },
            { key: "severity", header: "Severity" },
            { key: "recoveryStatus", header: "Status" },
            { key: "confidence", header: "Confidence" },
          ]}
          rows={view.resilienceIncidentRegister}
        />
      </Panel>

      <Panel title="Resilience Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.resilienceAnalysis}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Executive Resilience Pipeline">
          <DataTable
            columns={[
              { key: "label", header: "Phase" },
              { key: "order", header: "Order" },
              { key: "status", header: "Status" },
            ]}
            rows={view.executiveResiliencePipeline}
          />
        </Panel>

        <Panel title="Resilience Metrics">
          <div className="space-y-2 text-sm text-[#c8c0b0]">
            <p>Total incidents: {view.metrics.totalIncidents}</p>
            <p>Active: {view.metrics.activeIncidentCount}</p>
            <p>Recovered: {view.metrics.recoveredCount}</p>
            <p>Average recovery: {view.metrics.averageRecoveryTime}</p>
            <p>Continuity availability: {view.metrics.continuityAvailability}%</p>
            <p>Last scan: {new Date(view.monitoringStatus.lastScanAt).toLocaleString()}</p>
          </div>
        </Panel>
      </div>

      <Panel title="Executive Recommendations">
        <div className="space-y-4">
          {view.recommendedActions.map((rec) => (
            <div key={rec.id} className="rounded-lg border border-gold/20 px-4 py-3">
              <p className="font-medium text-[#d4af37]">{rec.title}</p>
              <p className="mt-1 text-sm text-[#c8c0b0]">{rec.why}</p>
              <p className="mt-1 text-xs text-[#8a847a]">
                {rec.what} · Confidence {rec.confidencePercent}%
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Pillow Advisory">
        <ul className="list-inside list-disc space-y-1 text-sm text-[#c8c0b0]">
          {view.pillowAdvisory.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Panel>

      <Panel title="E5 Integration Status">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(view.integrations).map(([key, value]) => (
            <div key={key} className="rounded border border-gold/10 px-3 py-2 text-xs">
              <p className="text-[#6f6a60]">{key}</p>
              <p className="text-[#e8e0d0]">{value}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
