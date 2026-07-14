"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type SessionContinuityPayload = {
  sessionContinuity?: {
    computedAt: string;
    engine: {
      status: string;
      performance: {
        successfulUpdates: number;
        interruptionsDetected: number;
        recoveriesCompleted: number;
      };
      health: { status: string; healthScore: number };
    };
    cockpit: {
      continuityStatus: string;
      healthStatus: string;
      updatesApplied: number;
      currentScreenId: string | null;
      recoveryStatus: string | null;
      continuityConfidence: number;
      interruptionDetected: boolean;
      recentLogs: string[];
    };
    latestContinuity: {
      sessionContinuityId: string;
      currentScreenId: string | null;
      currentWorkflowContextId: string | null;
      currentUiStateId: string;
      recoveryStatus: string;
      continuityConfidence: number;
    } | null;
  };
  live?: boolean;
};

/** T1-09 — Session Continuity development panel. */
export function DevelopmentSessionContinuityPanel() {
  const [data, setData] = useState<SessionContinuityPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/session-continuity", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as SessionContinuityPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Session Continuity");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 5000);
    return () => clearInterval(id);
  }, [load]);

  const sce = data?.sessionContinuity;
  const engine = sce?.engine;
  const cockpit = sce?.cockpit;
  const latest = sce?.latestContinuity;

  if (loading && !data) {
    return <Panel title="Session Continuity">Loading session continuity…</Panel>;
  }

  if (error) {
    return (
      <Panel title="Session Continuity" subtitle="T1-09 · Preserve UX context">
        <p className="text-sm text-amber-200">{error}</p>
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      <Panel title="Session Continuity" subtitle="T1-09 · Continuous session awareness">
        <div className="flex flex-wrap items-center gap-2">
          <DataModeBadge mode={data?.live === false ? "sandbox" : "live"} />
          <span className="text-xs text-[#6f6a60]">
            Status: {engine?.status ?? cockpit?.continuityStatus ?? "unknown"}
          </span>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-4 text-sm">
          <div>
            <p className="text-xs text-[#6f6a60]">Updates Applied</p>
            <p className="text-[#d4af37]">
              {cockpit?.updatesApplied ?? engine?.performance.successfulUpdates ?? 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">Screen</p>
            <p>{cockpit?.currentScreenId ?? latest?.currentScreenId ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">Recovery</p>
            <p>{cockpit?.recoveryStatus ?? latest?.recoveryStatus ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">Confidence</p>
            <p>{cockpit?.continuityConfidence ?? latest?.continuityConfidence ?? 0}</p>
          </div>
        </div>
      </Panel>

      {latest && (
        <Panel title="Latest Session Continuity">
          <DataTable
            columns={[
              { key: "field", header: "Field" },
              { key: "value", header: "Value" },
            ]}
            rows={[
              { field: "Continuity ID", value: latest.sessionContinuityId, key: "id" },
              { field: "UI State", value: latest.currentUiStateId, key: "ui" },
              { field: "Workflow Context", value: latest.currentWorkflowContextId ?? "—", key: "wf" },
              { field: "Recovery", value: latest.recoveryStatus, key: "recovery" },
            ]}
          />
        </Panel>
      )}

      {cockpit?.recentLogs && cockpit.recentLogs.length > 0 && (
        <Panel title="Continuity Logs">
          <DataTable
            columns={[{ key: "log", header: "Event" }]}
            rows={cockpit.recentLogs.map((log, i) => ({ log, key: String(i) }))}
          />
        </Panel>
      )}
    </div>
  );
}
