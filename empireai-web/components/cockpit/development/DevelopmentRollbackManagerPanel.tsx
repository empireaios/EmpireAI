"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type RollbackManagerPayload = {
  rollbackManager?: {
    computedAt: string;
    engine: {
      status: string;
      performance: { totalRollbacks: number; restorePointsCreated: number };
      health: { status: string; healthScore: number };
    };
    readiness: {
      missionId: string;
      healthScore: number;
      engineStatus: string;
      lastDecision: string | null;
    };
    cockpit: {
      engineStatus: string;
      healthStatus: string;
      lastDecision: string | null;
      rollbacksCount: number;
      restorePointsCount: number;
      verifiedCount: number;
      confidenceScore: number;
      totalRollbacks: number;
      recentLogs: string[];
    };
    latestReport: {
      rollbackRunReportId: string;
      reports: {
        rollbackReportId: string;
        rollbackTrigger: string;
        rollbackStatus: string;
        revertedFiles: string[];
        revertedComponents: string[];
      }[];
      restorePoints: { restorePointId: string; restorePointStatus: string }[];
      validation: { decision: string; warnings: string[] };
    } | null;
  };
  live?: boolean;
};

/** T3-08 — Rollback Manager development panel. */
export function DevelopmentRollbackManagerPanel() {
  const [data, setData] = useState<RollbackManagerPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/rollback-manager", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as RollbackManagerPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Rollback Manager");
    } finally {
      setLoading(false);
    }
  }, []);

  const createRestorePoint = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/rollback-manager/create-restore-point", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create restore point");
    } finally {
      setRunning(false);
    }
  }, [load]);

  const runRollback = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/rollback-manager/rollback", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to execute rollback");
    } finally {
      setRunning(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const snapshot = data?.rollbackManager;
  const report = snapshot?.latestReport;

  return (
    <div className="space-y-4">
      <Panel
        title="Rollback Manager (T3-08)"
        description="Creates restore points and safely recovers from failed UI changes."
        actions={
          <div className="flex items-center gap-2">
            <DataModeBadge live={data?.live !== false && !!snapshot} />
            <button
              type="button"
              className="rounded-md border border-border px-3 py-1 text-sm"
              onClick={() => void load()}
              disabled={loading}
            >
              Refresh
            </button>
            <button
              type="button"
              className="rounded-md border border-border px-3 py-1 text-sm"
              onClick={() => void createRestorePoint()}
              disabled={running}
            >
              Create Restore Point
            </button>
            <button
              type="button"
              className="rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground"
              onClick={() => void runRollback()}
              disabled={running}
            >
              {running ? "Rolling back…" : "Execute Rollback"}
            </button>
          </div>
        }
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading && !snapshot ? (
          <p className="text-sm text-muted-foreground">Loading Rollback Manager…</p>
        ) : snapshot ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Rollbacks</p>
              <p className="text-2xl font-bold">{snapshot.cockpit.rollbacksCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Restore Points</p>
              <p className="font-medium">{snapshot.cockpit.restorePointsCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Verified</p>
              <p className="font-medium">{snapshot.cockpit.verifiedCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Decision</p>
              <p className="font-medium">{snapshot.cockpit.lastDecision ?? "—"}</p>
            </div>
          </div>
        ) : null}
      </Panel>

      {report && report.reports.length > 0 ? (
        <Panel title="Rollback Reports" description={report.rollbackRunReportId}>
          <DataTable
            columns={[
              { key: "trigger", header: "Trigger" },
              { key: "status", header: "Status" },
              { key: "files", header: "Files Reverted" },
            ]}
            rows={report.reports.map((r) => ({
              trigger: r.rollbackTrigger,
              status: r.rollbackStatus,
              files: String(r.revertedFiles.length),
            }))}
          />
        </Panel>
      ) : null}

      {snapshot?.cockpit.recentLogs.length ? (
        <Panel title="Recent Logs" description="Rollback manager activity">
          <ul className="space-y-1 text-sm text-muted-foreground">
            {snapshot.cockpit.recentLogs.map((log) => (
              <li key={log}>{log}</li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}
