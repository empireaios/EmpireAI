"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type ExecutionControlCenterPayload = {
  executionControlCenter: {
    computedAt: string;
    cockpit: {
      executionQueue: Array<{
        missionId: string;
        title: string;
        state: string;
        priority: number;
        progressPercent: number;
      }>;
      currentMission: string;
      currentPhase: string;
      executionState: string;
      dependencies: string[];
      priority: number;
      overallProgress: string;
      currentRisks: string[];
      currentBottlenecks: string[];
      executionTimeline: string[];
      grandKingSummary: string;
      analysis: { recommendations: string[] };
    };
    readiness: {
      readinessScore: number;
      steps: Array<{ label: string; status: string; summary: string }>;
    };
  };
};

/** P6-01 — Execution Control Center Cockpit panel. */
export function DevelopmentExecutionControlCenterPanel() {
  const [data, setData] = useState<ExecutionControlCenterPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/execution-control-center", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutionControlCenterPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Execution Control Center");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <Panel title="Execution Control">Loading ECC state…</Panel>;
  }

  if (error || !data) {
    return (
      <Panel title="Execution Control">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void load()}>
          Retry
        </button>
      </Panel>
    );
  }

  const { cockpit, readiness } = data.executionControlCenter;

  return (
    <div className="space-y-6">
      <Panel title="Execution Control Center" subtitle="P6-01 · PILLOW-ECC-001">
        <DataModeBadge mode="live" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-white/50">Current Mission</p>
            <p className="text-sm font-medium text-[#f0d78c]">{cockpit.currentMission}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Execution State</p>
            <p className="text-sm font-medium text-[#f0d78c]">{cockpit.executionState}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Current Phase</p>
            <p className="text-sm text-[#c8c0b0]">{cockpit.currentPhase}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Overall Progress</p>
            <p className="text-sm text-[#c8c0b0]">{cockpit.overallProgress}</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-[#c8c0b0]">{cockpit.grandKingSummary}</p>
      </Panel>

      {cockpit.executionQueue.length > 0 && (
        <Panel title="Execution Queue">
          <DataTable
            columns={[
              { key: "missionId", header: "Mission" },
              { key: "title", header: "Title" },
              { key: "state", header: "State" },
              { key: "progressPercent", header: "Progress" },
            ]}
            rows={cockpit.executionQueue.map((q) => ({
              missionId: q.missionId,
              title: q.title,
              state: q.state,
              progressPercent: `${q.progressPercent}%`,
            }))}
          />
        </Panel>
      )}

      <Panel title="Dependencies">
        <ul className="list-disc space-y-1 pl-5 text-sm text-[#c8c0b0]">
          {cockpit.dependencies.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </Panel>

      <Panel title="Execution Timeline">
        <ul className="space-y-1 text-sm text-[#c8c0b0]">
          {cockpit.executionTimeline.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </Panel>

      {(cockpit.currentRisks.length > 0 || cockpit.currentBottlenecks.length > 0) && (
        <Panel title="Risks & Bottlenecks">
          {cockpit.currentRisks.length > 0 && (
            <ul className="mb-3 list-disc space-y-1 pl-5 text-sm text-amber-200">
              {cockpit.currentRisks.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
          {cockpit.currentBottlenecks.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-sm text-[#c8c0b0]">
              {cockpit.currentBottlenecks.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
        </Panel>
      )}

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
