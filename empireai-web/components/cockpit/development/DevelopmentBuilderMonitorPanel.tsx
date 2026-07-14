"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type BuilderMonitorPayload = {
  builderMonitor: {
    computedAt: string;
    cockpit: {
      currentMission: string;
      currentStep: string;
      currentActivity: string;
      progress: string;
      elapsedTimeMs: number;
      estimatedRemainingTimeMs: number | null;
      heartbeat: string;
      repositoryActivity: string;
      filesModified: string[];
      validationStatus: string;
      recoveryStatus: string;
      executionHealth: string;
      recentEvents: Array<{ at: string; kind: string; detail: string }>;
      grandKingSummary: string;
      analysis: { recommendations: string[] };
    };
    readiness: {
      readinessScore: number;
      steps: Array<{ label: string; status: string; summary: string }>;
    };
  };
};

/** P6-04 — Builder Monitor Cockpit panel. */
export function DevelopmentBuilderMonitorPanel() {
  const [data, setData] = useState<BuilderMonitorPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/builder-monitor", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as BuilderMonitorPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Builder Monitor");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 15_000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) {
    return <Panel title="Builder Monitor">Loading Builder telemetry…</Panel>;
  }

  if (error || !data) {
    return (
      <Panel title="Builder Monitor">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void load()}>
          Retry
        </button>
      </Panel>
    );
  }

  const { cockpit, readiness } = data.builderMonitor;

  return (
    <div className="space-y-6">
      <Panel title="Builder Monitor (P6-04)">
        <div className="flex flex-wrap items-center gap-3">
          <DataModeBadge mode="live" />
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data.builderMonitor.computedAt).toLocaleTimeString()}
          </span>
        </div>
        <p className="mt-3 text-sm text-[#c8c0b0]">{cockpit.grandKingSummary}</p>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Execution">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[#6f6a60]">Mission</dt>
              <dd className="text-right text-[#c8c0b0]">{cockpit.currentMission}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#6f6a60]">Step</dt>
              <dd className="text-right text-[#c8c0b0]">{cockpit.currentStep}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#6f6a60]">Activity</dt>
              <dd className="text-right text-[#c8c0b0]">{cockpit.currentActivity}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#6f6a60]">Progress</dt>
              <dd className="text-right text-[#d4af37]">{cockpit.progress}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#6f6a60]">Health</dt>
              <dd className="text-right capitalize text-[#c8c0b0]">{cockpit.executionHealth}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#6f6a60]">Heartbeat</dt>
              <dd className="text-right text-xs text-[#8a847a]">{cockpit.heartbeat}</dd>
            </div>
          </dl>
        </Panel>

        <Panel title="Repository & Validation">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[#6f6a60]">Repository</dt>
              <dd className="text-right text-[#c8c0b0]">{cockpit.repositoryActivity}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#6f6a60]">Validation</dt>
              <dd className="text-right text-[#c8c0b0]">{cockpit.validationStatus}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#6f6a60]">Recovery</dt>
              <dd className="text-right text-[#c8c0b0]">{cockpit.recoveryStatus}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#6f6a60]">Elapsed</dt>
              <dd className="text-right text-[#c8c0b0]">
                {Math.round(cockpit.elapsedTimeMs / 1000)}s
              </dd>
            </div>
          </dl>
          {cockpit.filesModified.length > 0 && (
            <p className="mt-3 text-xs text-[#6f6a60]">
              Files: {cockpit.filesModified.slice(0, 5).join(", ")}
            </p>
          )}
        </Panel>
      </div>

      {cockpit.recentEvents.length > 0 && (
        <Panel title="Builder Events">
          <DataTable
            columns={[
              { key: "at", label: "Time" },
              { key: "kind", label: "Event" },
              { key: "detail", label: "Detail" },
            ]}
            rows={cockpit.recentEvents.map((e) => ({
              at: new Date(e.at).toLocaleTimeString(),
              kind: e.kind.replace(/_/g, " "),
              detail: e.detail.slice(0, 80),
            }))}
          />
        </Panel>
      )}

      <Panel title="Readiness">
        <p className="text-sm text-[#c8c0b0]">Score: {readiness.readinessScore}/100</p>
      </Panel>
    </div>
  );
}
