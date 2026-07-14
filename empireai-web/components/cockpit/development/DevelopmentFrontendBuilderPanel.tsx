"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type FrontendBuilderPayload = {
  frontendBuilder?: {
    computedAt: string;
    engine: {
      status: string;
      performance: { totalBuilds: number; totalRecordsGenerated: number };
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
      validatedCount: number;
      blockedCount: number;
      confidenceScore: number;
      totalBuilds: number;
      recentLogs: string[];
    };
    latestReport: {
      frontendBuildReportId: string;
      records: {
        buildRecordId: string;
        sourceRecommendationId: string;
        targetFiles: string[];
        buildStatus: string;
        confidenceScore: number;
        proposedCodeChanges: { targetFile: string; scope: string }[];
        implementationPlan: { steps: string[] };
        safetyChecks: { checkName: string; passed: boolean }[];
      }[];
      validation: { decision: string; warnings: string[] };
    } | null;
  };
  live?: boolean;
};

/** T3-01 — Frontend Builder development panel. */
export function DevelopmentFrontendBuilderPanel() {
  const [data, setData] = useState<FrontendBuilderPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/frontend-builder", {
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as FrontendBuilderPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Frontend Builder");
    } finally {
      setLoading(false);
    }
  }, []);

  const runBuild = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/frontend-builder/build", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate frontend code");
    } finally {
      setRunning(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const snapshot = data?.frontendBuilder;
  const report = snapshot?.latestReport;

  return (
    <div className="space-y-4">
      <Panel
        title="Frontend Builder (T3-01)"
        description="Generates frontend code from approved UX recommendations."
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
              {running ? "Building…" : "Generate Code"}
            </button>
          </div>
        }
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading && !snapshot ? (
          <p className="text-sm text-muted-foreground">Loading Frontend Builder…</p>
        ) : snapshot ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Build Records</p>
              <p className="text-2xl font-bold">{snapshot.cockpit.recordsCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Validated / Blocked</p>
              <p className="font-medium">
                {snapshot.cockpit.validatedCount} / {snapshot.cockpit.blockedCount}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Confidence</p>
              <p className="font-medium">{snapshot.cockpit.confidenceScore}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Builds</p>
              <p className="font-medium">{snapshot.cockpit.totalBuilds}</p>
            </div>
          </div>
        ) : null}
      </Panel>

      {report && report.records.length > 0 ? (
        <>
          <Panel title="Build Records" description={report.frontendBuildReportId}>
            <DataTable
              columns={[
                { key: "id", header: "Record" },
                { key: "recommendation", header: "Recommendation" },
                { key: "files", header: "Files" },
                { key: "status", header: "Status" },
                { key: "safety", header: "Safety" },
              ]}
              rows={report.records.map((r) => ({
                id: r.buildRecordId,
                recommendation: r.sourceRecommendationId,
                files: r.targetFiles.length,
                status: r.buildStatus,
                safety: `${r.safetyChecks.filter((c) => c.passed).length}/${r.safetyChecks.length}`,
              }))}
            />
          </Panel>

          <Panel title="Implementation Plan" description={report.records[0]?.buildRecordId}>
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              {report.records[0]?.implementationPlan.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </Panel>
        </>
      ) : report ? (
        <Panel title="Build Records">
          <p className="text-sm text-muted-foreground">
            No build records — run recommendations first or lower confidence threshold.
          </p>
        </Panel>
      ) : null}

      {report ? (
        <Panel title="Validation">
          <p className="text-sm">
            Decision: <strong>{report.validation.decision}</strong>
          </p>
        </Panel>
      ) : null}
    </div>
  );
}
