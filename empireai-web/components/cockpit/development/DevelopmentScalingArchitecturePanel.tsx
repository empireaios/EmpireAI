"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type ScalingArchitecturePayload = {
  scalingArchitecture: {
    computedAt: string;
    cockpit: {
      currentCapacity: string;
      currentStage: string;
      scalingReadiness: string;
      infrastructureHealth: string;
      databaseStatus: string;
      queueStatus: string;
      workerStatus: string;
      recommendedNextStage: string;
      knownBottlenecks: string[];
      migrationStrategy: string[];
      grandKingSummary: string;
      analysis: { recommendations: string[] };
    };
    readiness: {
      readinessScore: number;
      steps: Array<{ label: string; status: string; summary: string }>;
    };
  };
};

/** P5-05 — Scaling Architecture Cockpit panel. */
export function DevelopmentScalingArchitecturePanel() {
  const [data, setData] = useState<ScalingArchitecturePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/scaling-architecture", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ScalingArchitecturePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Scaling Architecture");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <Panel title="Scaling">Loading scaling architecture state…</Panel>;
  }

  if (error || !data) {
    return (
      <Panel title="Scaling">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void load()}>
          Retry
        </button>
      </Panel>
    );
  }

  const { cockpit, readiness } = data.scalingArchitecture;

  return (
    <div className="space-y-6">
      <Panel title="Scaling Status" subtitle="P5-05 · PILLOW-SCL-001">
        <DataModeBadge mode="live" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-white/50">Current Stage</p>
            <p className="text-sm font-medium text-[#f0d78c]">{cockpit.currentStage}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Recommended Next</p>
            <p className="text-sm font-medium text-[#f0d78c]">{cockpit.recommendedNextStage}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Scaling Readiness</p>
            <p className="text-sm text-[#c8c0b0]">{cockpit.scalingReadiness}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Current Capacity</p>
            <p className="text-sm text-[#c8c0b0]">{cockpit.currentCapacity}</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-[#c8c0b0]">{cockpit.grandKingSummary}</p>
      </Panel>

      <Panel title="Infrastructure">
        <DataTable
          columns={[
            { key: "component", header: "Component" },
            { key: "status", header: "Status" },
          ]}
          rows={[
            { component: "Infrastructure", status: cockpit.infrastructureHealth },
            { component: "Database", status: cockpit.databaseStatus },
            { component: "Queue", status: cockpit.queueStatus },
            { component: "Workers", status: cockpit.workerStatus },
          ]}
        />
      </Panel>

      <Panel title="Known Bottlenecks">
        <ul className="list-disc space-y-1 pl-5 text-sm text-[#c8c0b0]">
          {cockpit.knownBottlenecks.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </Panel>

      <Panel title="Migration Strategy">
        <ul className="space-y-1 text-sm text-[#c8c0b0]">
          {cockpit.migrationStrategy.map((phase) => (
            <li key={phase}>{phase}</li>
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
