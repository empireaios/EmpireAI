"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type DurableSessionsPayload = {
  durableSessions: {
    computedAt: string;
    cockpit: {
      currentSessions: string;
      sessionHealth: string;
      recoveredSessions: number;
      sessionDuration: string;
      recoveryStatus: string[];
      expiration: string;
      authenticationStatus: string;
      grandKingSummary: string;
      layers: string[];
      analysis: { recommendations: string[] };
    };
    readiness: {
      readinessScore: number;
      steps: Array<{ label: string; status: string; summary: string }>;
    };
  };
};

/** P5-03 — Durable Sessions Cockpit panel. */
export function DevelopmentDurableSessionsPanel() {
  const [data, setData] = useState<DurableSessionsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/durable-sessions", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as DurableSessionsPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <Panel title="Sessions">Loading session architecture state…</Panel>;
  }

  if (error || !data) {
    return (
      <Panel title="Sessions">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void load()}>
          Retry
        </button>
      </Panel>
    );
  }

  const { cockpit, readiness } = data.durableSessions;

  return (
    <div className="space-y-6">
      <Panel title="Session Health" subtitle="P5-03 · PILLOW-DS-001">
        <DataModeBadge mode="live" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-white/50">Overall Status</p>
            <p className="text-sm font-medium text-[#f0d78c]">{cockpit.sessionHealth}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Authentication</p>
            <p className="text-sm text-[#c8c0b0]">{cockpit.authenticationStatus}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Current Sessions</p>
            <p className="text-sm text-[#c8c0b0]">{cockpit.currentSessions}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Recovered</p>
            <p className="text-sm text-[#c8c0b0]">{cockpit.recoveredSessions} layers</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-[#c8c0b0]">{cockpit.grandKingSummary}</p>
        <p className="mt-2 text-xs text-white/50">{cockpit.expiration}</p>
      </Panel>

      <Panel title="Session Layers">
        <ul className="space-y-1 text-sm text-[#c8c0b0]">
          {cockpit.layers.map((layer) => (
            <li key={layer}>{layer}</li>
          ))}
        </ul>
      </Panel>

      <Panel title="Recovery Status">
        <ul className="space-y-1 text-sm text-[#c8c0b0]">
          {cockpit.recoveryStatus.map((status) => (
            <li key={status}>{status}</li>
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
