"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type PreviewGeneratorPayload = {
  previewGenerator?: {
    computedAt: string;
    engine: {
      status: string;
      performance: { totalPreviews: number; totalPreviewBuilds: number };
      health: { status: string; healthScore: number; activeEnvironments: number };
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
      previewsCount: number;
      validatedCount: number;
      blockedCount: number;
      activeEnvironments: number;
      confidenceScore: number;
      totalPreviews: number;
      recentLogs: string[];
    };
    latestReport: {
      previewGenerationReportId: string;
      records: {
        previewBuildId: string;
        previewScope: string;
        previewTargetScreenId: string;
        previewUrl: string | null;
        buildStatus: string;
        confidenceScore: number;
        previewEnvironmentStatus: string;
        safetyChecks: { checkName: string; passed: boolean }[];
      }[];
      validation: { decision: string; warnings: string[] };
    } | null;
  };
  live?: boolean;
};

/** T3-05 — Preview Generator development panel. */
export function DevelopmentPreviewGeneratorPanel() {
  const [data, setData] = useState<PreviewGeneratorPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/preview-generator", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as PreviewGeneratorPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Preview Generator");
    } finally {
      setLoading(false);
    }
  }, []);

  const runBuild = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/preview-generator/build", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to build previews");
    } finally {
      setRunning(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const snapshot = data?.previewGenerator;
  const report = snapshot?.latestReport;

  return (
    <div className="space-y-4">
      <Panel
        title="Preview Generator (T3-05)"
        description="Generates instant isolated preview builds for immediate UX review."
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
              onClick={() => void runBuild()}
              disabled={running}
            >
              {running ? "Building…" : "Build Previews"}
            </button>
          </div>
        }
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading && !snapshot ? (
          <p className="text-sm text-muted-foreground">Loading Preview Generator…</p>
        ) : snapshot ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Previews</p>
              <p className="text-2xl font-bold">{snapshot.cockpit.previewsCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Validated / Blocked</p>
              <p className="font-medium">
                {snapshot.cockpit.validatedCount} / {snapshot.cockpit.blockedCount}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Environments</p>
              <p className="font-medium">{snapshot.cockpit.activeEnvironments}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Previews</p>
              <p className="font-medium">{snapshot.cockpit.totalPreviews}</p>
            </div>
          </div>
        ) : null}
      </Panel>

      {report && report.records.length > 0 ? (
        <>
          <Panel title="Preview Builds" description={report.previewGenerationReportId}>
            <DataTable
              columns={[
                { key: "screen", header: "Screen" },
                { key: "scope", header: "Scope" },
                { key: "status", header: "Status" },
                { key: "url", header: "Preview URL" },
              ]}
              rows={report.records.map((r) => ({
                screen: r.previewTargetScreenId,
                scope: r.previewScope,
                status: r.buildStatus,
                url: r.previewUrl ?? "—",
              }))}
            />
          </Panel>
          <Panel title="Recent Logs" description="Preview generator activity">
            <ul className="space-y-1 text-sm text-muted-foreground">
              {snapshot?.cockpit.recentLogs.map((log) => (
                <li key={log}>{log}</li>
              ))}
            </ul>
          </Panel>
        </>
      ) : null}
    </div>
  );
}
