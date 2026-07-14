"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type PerformanceGovernancePayload = {
  performanceGovernance: {
    computedAt: string;
    cockpit: {
      overallPerformanceScore: number;
      performanceGrade: string;
      runtimePerformance: string;
      browserPerformance: string;
      missionPerformance: string;
      apiPerformance: string;
      databasePerformance: string;
      queuePerformance: string;
      workerPerformance: string;
      performanceTrends: string[];
      currentBottlenecks: string[];
      recommendations: string[];
      grandKingSummary: string;
      phaseP5Review: Array<{ missionId: string; name: string; status: string }>;
      analysis: { recommendations: string[] };
    };
    readiness: {
      readinessScore: number;
      steps: Array<{ label: string; status: string; summary: string }>;
    };
  };
};

/** P5-06 — Performance Governance Cockpit panel. */
export function DevelopmentPerformanceGovernancePanel() {
  const [data, setData] = useState<PerformanceGovernancePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/performance-governance", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as PerformanceGovernancePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Performance Governance");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <Panel title="Performance">Loading performance governance state…</Panel>;
  }

  if (error || !data) {
    return (
      <Panel title="Performance">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void load()}>
          Retry
        </button>
      </Panel>
    );
  }

  const { cockpit, readiness } = data.performanceGovernance;

  return (
    <div className="space-y-6">
      <Panel title="Performance Status" subtitle="P5-06 · PILLOW-PG-001 · Phase P5 Complete">
        <DataModeBadge mode="live" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-white/50">Overall Score</p>
            <p className="text-sm font-medium text-[#f0d78c]">
              {cockpit.overallPerformanceScore}/100 · {cockpit.performanceGrade}
            </p>
          </div>
          <div>
            <p className="text-xs text-white/50">Phase P5</p>
            <p className="text-sm font-medium text-emerald-200">Complete · Ready for P6-01 ECC</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-[#c8c0b0]">{cockpit.grandKingSummary}</p>
      </Panel>

      <Panel title="Runtime Performance">
        <DataTable
          columns={[
            { key: "component", header: "Component" },
            { key: "status", header: "Status" },
          ]}
          rows={[
            { component: "Runtime", status: cockpit.runtimePerformance },
            { component: "Browser", status: cockpit.browserPerformance },
            { component: "Mission", status: cockpit.missionPerformance },
            { component: "API", status: cockpit.apiPerformance },
            { component: "Database", status: cockpit.databasePerformance },
            { component: "Queue", status: cockpit.queuePerformance },
            { component: "Workers", status: cockpit.workerPerformance },
          ]}
        />
      </Panel>

      {cockpit.performanceTrends.length > 0 && (
        <Panel title="Performance Trends">
          <ul className="list-disc space-y-1 pl-5 text-sm text-[#c8c0b0]">
            {cockpit.performanceTrends.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel title="Current Bottlenecks">
        <ul className="list-disc space-y-1 pl-5 text-sm text-[#c8c0b0]">
          {cockpit.currentBottlenecks.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </Panel>

      <Panel title="Phase P5 Review">
        <DataTable
          columns={[
            { key: "missionId", header: "Mission" },
            { key: "name", header: "Name" },
            { key: "status", header: "Status" },
          ]}
          rows={cockpit.phaseP5Review.map((m) => ({
            missionId: m.missionId,
            name: m.name,
            status: m.status,
          }))}
        />
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

      {cockpit.recommendations.length > 0 && (
        <Panel title="Recommendations">
          <ul className="list-disc space-y-1 pl-5 text-sm text-[#c8c0b0]">
            {cockpit.recommendations.map((rec) => (
              <li key={rec}>{rec}</li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
