"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type GuardianMonitoringPayload = {
  guardianMonitoring: {
    computedAt: string;
    cockpit: {
      overallHealth: string;
      runtimeHealth: string;
      brain: string;
      pillow: string;
      builder: string;
      supervisor: string;
      sessions: string;
      queues: string;
      workers: string;
      database: string;
      redis: string;
      api: string;
      alerts: Array<{
        alertId: string;
        severity: string;
        affectedComponent: string;
        observedSymptoms: string;
        recommendedAction: string;
      }>;
      historicalTrends: Array<{ timestamp: string; label: string; detail: string; health: string }>;
      grandKingSummary: string;
      affectedComponents: string[];
      analysis: { recommendations: string[] };
    };
    readiness: {
      readinessScore: number;
      steps: Array<{ label: string; status: string; summary: string }>;
    };
  };
};

/** P5-04 — Guardian Monitoring Cockpit panel. */
export function DevelopmentGuardianMonitoringPanel() {
  const [data, setData] = useState<GuardianMonitoringPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/guardian-monitoring", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as GuardianMonitoringPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Guardian Monitoring");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <Panel title="Monitoring">Loading Guardian monitoring state…</Panel>;
  }

  if (error || !data) {
    return (
      <Panel title="Monitoring">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void load()}>
          Retry
        </button>
      </Panel>
    );
  }

  const { cockpit, readiness } = data.guardianMonitoring;

  const componentRows = [
    { component: "Brain Runtime", health: cockpit.brain },
    { component: "Pillow", health: cockpit.pillow },
    { component: "Builder", health: cockpit.builder },
    { component: "Supervisor", health: cockpit.supervisor },
    { component: "Sessions", health: cockpit.sessions },
    { component: "Queues", health: cockpit.queues },
    { component: "Workers", health: cockpit.workers },
    { component: "Database", health: cockpit.database },
    { component: "Redis", health: cockpit.redis },
    { component: "API", health: cockpit.api },
  ];

  return (
    <div className="space-y-6">
      <Panel title="Empire Health" subtitle="P5-04 · PILLOW-GM-001">
        <DataModeBadge mode="live" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-white/50">Overall Health</p>
            <p className="text-sm font-medium text-[#f0d78c]">{cockpit.overallHealth}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Runtime Health</p>
            <p className="text-sm font-medium text-[#f0d78c]">{cockpit.runtimeHealth}</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-[#c8c0b0]">{cockpit.grandKingSummary}</p>
      </Panel>

      <Panel title="Component Health">
        <DataTable
          columns={[
            { key: "component", header: "Component" },
            { key: "health", header: "Health" },
          ]}
          rows={componentRows}
        />
      </Panel>

      <Panel title="Alerts">
        {cockpit.alerts.length === 0 ? (
          <p className="text-sm text-[#c8c0b0]">No open alerts</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {cockpit.alerts.map((alert) => (
              <li key={alert.alertId} className="rounded-lg border border-gold/10 px-3 py-2">
                <span className="text-xs uppercase text-amber-300">{alert.severity}</span>
                <p className="font-medium text-[#f0d78c]">{alert.affectedComponent}</p>
                <p className="text-[#c8c0b0]">{alert.observedSymptoms}</p>
                <p className="mt-1 text-xs text-white/50">{alert.recommendedAction}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Historical Trends">
        <ul className="space-y-1 text-sm text-[#c8c0b0]">
          {cockpit.historicalTrends.map((entry) => (
            <li key={`${entry.timestamp}-${entry.label}`}>
              {entry.label}: {entry.detail} ({entry.health})
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Readiness" subtitle={`Score ${readiness.readinessScore}/100`}>
        <DataTable
          columns={[
            { key: "label", header: "Check" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={readiness.steps.map((s) => ({
            label: s.label,
            status: s.status,
            summary: s.summary,
          }))}
        />
      </Panel>

      {cockpit.analysis.recommendations.length > 0 && (
        <Panel title="Recommendations">
          <ul className="list-disc space-y-1 pl-5 text-sm text-[#c8c0b0]">
            {cockpit.analysis.recommendations.map((rec) => (
              <li key={rec}>{rec}</li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
