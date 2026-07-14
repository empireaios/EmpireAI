"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type BrainRuntimePayload = {
  brainRuntime: {
    computedAt: string;
    cockpit: {
      runtimeHealth: string;
      memory: string;
      eventLoopLagMs: number;
      queues: string;
      workers: string;
      database: string;
      api: string;
      overallRuntimeStatus: string;
      responsive: boolean;
      bottlenecks: string[];
      analysis: { recommendations: string[] };
    };
    readiness: {
      readinessScore: number;
      steps: Array<{ label: string; status: string; summary: string }>;
    };
  };
};

/** P5-01 — Brain Runtime Cockpit panel. */
export function DevelopmentBrainRuntimePanel() {
  const [data, setData] = useState<BrainRuntimePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/brain-runtime", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as BrainRuntimePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Brain Runtime");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <Panel title="Runtime">Loading Brain runtime state…</Panel>;
  }

  if (error || !data) {
    return (
      <Panel title="Runtime">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void load()}>
          Retry
        </button>
      </Panel>
    );
  }

  const { cockpit, readiness } = data.brainRuntime;

  return (
    <div className="space-y-6">
      <Panel title="Runtime Health" subtitle="P5-01 · PILLOW-BR-001">
        <DataModeBadge mode="live" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-white/50">Overall Status</p>
            <p className="text-sm font-medium text-white">{cockpit.runtimeHealth}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Responsive</p>
            <p className="text-sm font-medium text-white">{cockpit.responsive ? "Yes" : "No"}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Event Loop Lag</p>
            <p className="text-sm font-medium text-white">{cockpit.eventLoopLagMs} ms</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Memory</p>
            <p className="text-sm font-medium text-white">{cockpit.memory}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Queues</p>
            <p className="text-sm font-medium text-white">{cockpit.queues}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Workers</p>
            <p className="text-sm font-medium text-white">{cockpit.workers}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Database</p>
            <p className="text-sm font-medium text-white">{cockpit.database}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">API</p>
            <p className="text-sm font-medium text-white">{cockpit.api}</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-white/70">{cockpit.overallRuntimeStatus}</p>
      </Panel>

      <Panel title="Runtime Readiness">
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
        <p className="mt-3 text-xs text-white/50">Readiness: {readiness.readinessScore}/100</p>
      </Panel>

      {cockpit.bottlenecks.length > 0 && (
        <Panel title="Active Bottlenecks">
          <ul className="list-disc pl-5 text-sm text-amber-200">
            {cockpit.bottlenecks.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </Panel>
      )}

      {cockpit.analysis.recommendations.length > 0 && (
        <Panel title="Runtime Recommendations">
          <ul className="list-disc pl-5 text-sm text-white/70">
            {cockpit.analysis.recommendations.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
