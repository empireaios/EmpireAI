"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type ContextAwarenessPayload = {
  contextAwareness?: {
    computedAt: string;
    engine: {
      status: string;
      performance: { successfulContexts: number; contextChanges: number; failedContexts: number };
      health: { status: string; healthScore: number };
    };
    cockpit: {
      awarenessStatus: string;
      healthStatus: string;
      contextsGenerated: number;
      currentWorkflowName: string | null;
      currentUserTask: string | null;
      contextState: string | null;
      interactionMode: string | null;
      changeDetected: boolean;
      confidenceScore: number;
      recentLogs: string[];
    };
    latestContext: {
      contextId: string;
      currentScreenId: string | null;
      currentWorkflowName: string | null;
      currentUserTask: string | null;
      contextState: string;
      currentInteractionMode: string;
      confidence: number;
      activeFormIds: string[];
      activeModalOrDrawerId: string | null;
    } | null;
  };
  live?: boolean;
};

/** T1-07 — Context Awareness development panel. */
export function DevelopmentContextAwarenessPanel() {
  const [data, setData] = useState<ContextAwarenessPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/context-awareness", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ContextAwarenessPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Context Awareness");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 5000);
    return () => clearInterval(id);
  }, [load]);

  const cae = data?.contextAwareness;
  const engine = cae?.engine;
  const cockpit = cae?.cockpit;
  const latest = cae?.latestContext;

  if (loading && !data) {
    return <Panel title="Context Awareness">Loading context awareness…</Panel>;
  }

  if (error) {
    return (
      <Panel title="Context Awareness" subtitle="T1-07 · Understand current workflow">
        <p className="text-sm text-amber-200">{error}</p>
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      <Panel title="Context Awareness" subtitle="T1-07 · Workflow context">
        <div className="flex flex-wrap items-center gap-2">
          <DataModeBadge mode={data?.live === false ? "sandbox" : "live"} />
          <span className="text-xs text-[#6f6a60]">
            Status: {engine?.status ?? cockpit?.awarenessStatus ?? "unknown"}
          </span>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-4 text-sm">
          <div>
            <p className="text-xs text-[#6f6a60]">Contexts Generated</p>
            <p className="text-[#d4af37]">
              {cockpit?.contextsGenerated ?? engine?.performance.successfulContexts ?? 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">Workflow</p>
            <p>{cockpit?.currentWorkflowName ?? latest?.currentWorkflowName ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">Context State</p>
            <p>{cockpit?.contextState ?? latest?.contextState ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">Confidence</p>
            <p>{cockpit?.confidenceScore ?? latest?.confidence ?? 0}</p>
          </div>
        </div>
      </Panel>

      {latest && (
        <Panel title="Latest Workflow Context">
          <DataTable
            columns={[
              { key: "field", header: "Field" },
              { key: "value", header: "Value" },
            ]}
            rows={[
              { field: "Context ID", value: latest.contextId, key: "id" },
              { field: "Screen", value: latest.currentScreenId ?? "—", key: "screen" },
              { field: "Task", value: latest.currentUserTask ?? "—", key: "task" },
              { field: "Mode", value: latest.currentInteractionMode, key: "mode" },
              { field: "State", value: latest.contextState, key: "state" },
              {
                field: "Active Modal",
                value: latest.activeModalOrDrawerId ?? "—",
                key: "modal",
              },
              {
                field: "Active Forms",
                value: latest.activeFormIds.length > 0 ? latest.activeFormIds.join(", ") : "—",
                key: "forms",
              },
            ]}
          />
        </Panel>
      )}

      {cockpit?.recentLogs && cockpit.recentLogs.length > 0 && (
        <Panel title="Context Logs">
          <DataTable
            columns={[{ key: "log", header: "Event" }]}
            rows={cockpit.recentLogs.map((log, i) => ({ log, key: String(i) }))}
          />
        </Panel>
      )}
    </div>
  );
}
