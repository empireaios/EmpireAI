"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type RecoveryPayload = {
  recovery: {
    computedAt: string;
    cockpit: {
      recoveryStatus: string;
      recoveryState: string;
      recoveryProgress: string;
      recoveryAttempts: number;
      recoveryConfidence: number;
      rootCause: string;
      currentRisks: string[];
      escalationLevel: string;
      recommendedAction: string;
      effectivenessScore: number;
    };
    metrics: {
      successRate: number;
      averageDurationMs: number;
      repeatedFailures: number;
      trend: string;
    };
    readiness: {
      readinessScore: number;
      steps: Array<{ label: string; status: string; summary: string }>;
    };
  };
};

/** P4-05 — Recovery Doctrine Cockpit panel. */
export function DevelopmentRecoveryPanel() {
  const [data, setData] = useState<RecoveryPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/recovery", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as RecoveryPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Recovery Doctrine");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <Panel title="Recovery Doctrine">Loading recovery state…</Panel>;
  }

  if (error || !data) {
    return (
      <Panel title="Recovery Doctrine">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void load()}>
          Retry
        </button>
      </Panel>
    );
  }

  const { cockpit, metrics, readiness } = data.recovery;

  return (
    <div className="space-y-6">
      <Panel title="Recovery Doctrine Status" subtitle="P4-05 · PILLOW-RD-001">
        <DataModeBadge mode="live" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-white/50">Recovery State</p>
            <p className="text-sm font-medium text-white">{cockpit.recoveryState}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Progress</p>
            <p className="text-sm font-medium text-white">{cockpit.recoveryProgress}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Confidence</p>
            <p className="text-sm font-medium text-white">
              {(cockpit.recoveryConfidence * 100).toFixed(0)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-white/50">Escalation Level</p>
            <p className="text-sm font-medium text-white">{cockpit.escalationLevel}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Attempts</p>
            <p className="text-sm font-medium text-white">{cockpit.recoveryAttempts}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Success Rate</p>
            <p className="text-sm font-medium text-white">
              {(metrics.successRate * 100).toFixed(0)}%
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-white/70">
          <span className="text-white/50">Root Cause: </span>
          {cockpit.rootCause}
        </p>
        <p className="mt-2 text-sm text-[#d4af37]">{cockpit.recommendedAction}</p>
      </Panel>

      <Panel title="Recovery Readiness">
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
        <p className="mt-3 text-xs text-white/50">
          Readiness score: {readiness.readinessScore}/100 · Trend: {metrics.trend}
        </p>
      </Panel>
    </div>
  );
}
