"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type ChangeDocumentationPayload = {
  changeDocumentation?: {
    computedAt: string;
    engine: {
      status: string;
      performance: { totalDocumentations: number; totalRecordsDocumented: number };
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
      recordsCount: number;
      acceptedCount: number;
      rejectedCount: number;
      confidenceScore: number;
      totalDocumentations: number;
      recentLogs: string[];
    };
    latestReport: {
      changeDocumentationRunReportId: string;
      records: {
        changeDocumentationId: string;
        changeType: string;
        changeSummary: string;
        affectedFiles: string[];
        finalChangeStatus: string;
      }[];
      validation: { decision: string; warnings: string[] };
    } | null;
  };
  live?: boolean;
};

/** T3-09 — Change Documentation development panel. */
export function DevelopmentChangeDocumentationPanel() {
  const [data, setData] = useState<ChangeDocumentationPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/change-documentation", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ChangeDocumentationPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Change Documentation");
    } finally {
      setLoading(false);
    }
  }, []);

  const runDocumentation = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/change-documentation/document", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to document changes");
    } finally {
      setRunning(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const snapshot = data?.changeDocumentation;
  const report = snapshot?.latestReport;

  return (
    <div className="space-y-4">
      <Panel
        title="Change Documentation (T3-09)"
        description="Documents and explains frontend modifications with full traceability."
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
              className="rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground"
              onClick={() => void runDocumentation()}
              disabled={running}
            >
              {running ? "Documenting…" : "Document Changes"}
            </button>
          </div>
        }
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading && !snapshot ? (
          <p className="text-sm text-muted-foreground">Loading Change Documentation…</p>
        ) : snapshot ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Records</p>
              <p className="text-2xl font-bold">{snapshot.cockpit.recordsCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Accepted</p>
              <p className="font-medium">{snapshot.cockpit.acceptedCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rejected</p>
              <p className="font-medium">{snapshot.cockpit.rejectedCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Decision</p>
              <p className="font-medium">{snapshot.cockpit.lastDecision ?? "—"}</p>
            </div>
          </div>
        ) : null}
      </Panel>

      {report && report.records.length > 0 ? (
        <Panel title="Change Records" description={report.changeDocumentationRunReportId}>
          <DataTable
            columns={[
              { key: "type", header: "Type" },
              { key: "summary", header: "Summary" },
              { key: "files", header: "Files" },
              { key: "status", header: "Status" },
            ]}
            rows={report.records.map((r) => ({
              type: r.changeType,
              summary: r.changeSummary.slice(0, 60),
              files: String(r.affectedFiles.length),
              status: r.finalChangeStatus,
            }))}
          />
        </Panel>
      ) : null}

      {snapshot?.cockpit.recentLogs.length ? (
        <Panel title="Recent Logs" description="Change documentation activity">
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
