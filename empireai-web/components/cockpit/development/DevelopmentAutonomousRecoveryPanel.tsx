"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type AutonomousRecoveryPayload = {
  autonomousRecoveryEngine: {
    computedAt: string;
    cockpit: {
      currentIncident: string;
      recoveryStrategy: string;
      recoveryProgress: string;
      recoveryAttempts: number;
      recoveryConfidence: number;
      currentRisks: string[];
      escalationLevel: string;
      recoveryTimeline: Array<{ at: string; stage: string; detail: string }>;
      recoveryHistory: Array<{
        incidentId: string;
        signal: string;
        strategy: string | null;
        recovered: boolean;
        at: string;
      }>;
      grandKingSummary: string;
    };
    readiness: {
      readinessScore: number;
      steps: Array<{ label: string; status: string; summary: string }>;
    };
  };
};

/** P6-06 — Autonomous Recovery Cockpit panel. */
export function DevelopmentAutonomousRecoveryPanel() {
  const [data, setData] = useState<AutonomousRecoveryPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/autonomous-recovery-engine", {
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as AutonomousRecoveryPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Autonomous Recovery");
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
    return <Panel title="Autonomous Recovery">Loading recovery status…</Panel>;
  }

  if (error || !data) {
    return (
      <Panel title="Autonomous Recovery">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void load()}>
          Retry
        </button>
      </Panel>
    );
  }

  const { cockpit, readiness } = data.autonomousRecoveryEngine;

  return (
    <div className="space-y-6">
      <Panel title="Autonomous Recovery Engine (P6-06)">
        <div className="flex flex-wrap items-center gap-3">
          <DataModeBadge mode="live" />
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data.autonomousRecoveryEngine.computedAt).toLocaleTimeString()}
          </span>
        </div>
        <p className="mt-3 text-sm text-[#c8c0b0]">{cockpit.grandKingSummary}</p>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Current Incident">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[#6f6a60]">Incident</dt>
              <dd className="text-right text-[#c8c0b0]">{cockpit.currentIncident}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#6f6a60]">Strategy</dt>
              <dd className="text-right text-[#d4af37]">{cockpit.recoveryStrategy}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#6f6a60]">Progress</dt>
              <dd className="text-right text-[#c8c0b0]">{cockpit.recoveryProgress}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#6f6a60]">Attempts</dt>
              <dd className="text-right text-[#c8c0b0]">{cockpit.recoveryAttempts}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#6f6a60]">Confidence</dt>
              <dd className="text-right text-[#d4af37]">{cockpit.recoveryConfidence}%</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#6f6a60]">Escalation</dt>
              <dd className="text-right capitalize text-[#c8c0b0]">
                {cockpit.escalationLevel.replace(/_/g, " ")}
              </dd>
            </div>
          </dl>
        </Panel>

        <Panel title="Current Risks">
          {cockpit.currentRisks.length > 0 ? (
            <ul className="list-inside list-disc text-sm text-[#c8c0b0]">
              {cockpit.currentRisks.map((risk) => (
                <li key={risk}>{risk}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#6f6a60]">No active risks — recovery standby</p>
          )}
        </Panel>
      </div>

      {cockpit.recoveryTimeline.length > 0 && (
        <Panel title="Recovery Timeline">
          <DataTable
            columns={[
              { key: "at", label: "Time" },
              { key: "stage", label: "Stage" },
              { key: "detail", label: "Detail" },
            ]}
            rows={cockpit.recoveryTimeline.map((e) => ({
              at: new Date(e.at).toLocaleTimeString(),
              stage: e.stage.replace(/_/g, " "),
              detail: e.detail.slice(0, 80),
            }))}
          />
        </Panel>
      )}

      {cockpit.recoveryHistory.length > 0 && (
        <Panel title="Recovery History">
          <DataTable
            columns={[
              { key: "at", label: "Time" },
              { key: "signal", label: "Signal" },
              { key: "strategy", label: "Strategy" },
              { key: "recovered", label: "Recovered" },
            ]}
            rows={cockpit.recoveryHistory.map((h) => ({
              at: new Date(h.at).toLocaleTimeString(),
              signal: h.signal.replace(/_/g, " "),
              strategy: h.strategy?.replace(/_/g, " ") ?? "—",
              recovered: h.recovered ? "Yes" : "No",
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
