"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type SupervisorSystemPayload = {
  supervisorSystem: {
    computedAt: string;
    cockpit: {
      currentMission: string;
      currentPhase: string;
      currentStep: string;
      missionHealth: string;
      executionState: string;
      progress: string;
      overallProgressPercent: number;
      dependencies: string[];
      currentRisks: string[];
      warnings: string[];
      recoveryStatus: string;
      validationStatus: string;
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

/** P6-03 — Supervisor System Cockpit panel. */
export function DevelopmentSupervisorSystemPanel() {
  const [data, setData] = useState<SupervisorSystemPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/supervisor-system", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as SupervisorSystemPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Supervisor System");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 30_000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) {
    return <Panel title="Supervisor">Loading supervision state…</Panel>;
  }

  if (error || !data) {
    return (
      <Panel title="Supervisor">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void load()}>
          Retry
        </button>
      </Panel>
    );
  }

  const { cockpit, readiness } = data.supervisorSystem;

  return (
    <div className="space-y-6">
      <Panel title="Supervisor System (P6-03)">
        <div className="flex flex-wrap items-center gap-3">
          <DataModeBadge mode="live" />
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data.supervisorSystem.computedAt).toLocaleTimeString()}
          </span>
        </div>
        <p className="mt-3 text-sm text-[#c8c0b0]">{cockpit.grandKingSummary}</p>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Current Mission">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[#6f6a60]">Mission</dt>
              <dd className="text-right text-[#c8c0b0]">{cockpit.currentMission}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#6f6a60]">Phase</dt>
              <dd className="text-right text-[#c8c0b0]">{cockpit.currentPhase}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#6f6a60]">Current Step</dt>
              <dd className="text-right text-[#c8c0b0]">{cockpit.currentStep}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#6f6a60]">Health</dt>
              <dd className="text-right capitalize text-[#d4af37]">{cockpit.missionHealth}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#6f6a60]">Progress</dt>
              <dd className="text-right text-[#c8c0b0]">{cockpit.progress}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#6f6a60]">Execution State</dt>
              <dd className="text-right text-[#c8c0b0]">{cockpit.executionState}</dd>
            </div>
          </dl>
        </Panel>

        <Panel title="Recovery & Validation">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[#6f6a60]">Recovery</dt>
              <dd className="text-right text-[#c8c0b0]">{cockpit.recoveryStatus}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#6f6a60]">Validation</dt>
              <dd className="text-right text-[#c8c0b0]">{cockpit.validationStatus}</dd>
            </div>
          </dl>
          {cockpit.dependencies.length > 0 && (
            <p className="mt-4 text-xs text-[#6f6a60]">
              Dependencies: {cockpit.dependencies.join(", ")}
            </p>
          )}
        </Panel>
      </div>

      {(cockpit.currentRisks.length > 0 || cockpit.warnings.length > 0) && (
        <Panel title="Risks & Warnings">
          {cockpit.currentRisks.length > 0 && (
            <ul className="mb-3 list-disc pl-5 text-sm text-amber-200">
              {cockpit.currentRisks.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
          {cockpit.warnings.length > 0 && (
            <ul className="list-disc pl-5 text-sm text-[#8a847a]">
              {cockpit.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      {cockpit.recentEvents.length > 0 && (
        <Panel title="Supervision Events">
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
        <ul className="mt-3 space-y-1 text-xs text-[#8a847a]">
          {readiness.steps.map((s) => (
            <li key={s.label}>
              {s.status === "passed" ? "✓" : "○"} {s.label} — {s.summary}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
