"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type LayoutRefactoringPayload = {
  layoutRefactoring?: {
    computedAt: string;
    engine: {
      status: string;
      performance: { totalRefactorings: number; totalLayoutsRefactored: number };
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
      layoutsCount: number;
      validatedCount: number;
      blockedCount: number;
      confidenceScore: number;
      totalRefactorings: number;
      recentLogs: string[];
    };
    latestReport: {
      layoutRefactoringReportId: string;
      records: {
        layoutRefactoringId: string;
        sourceRecommendationId: string;
        targetScreenId: string;
        targetFiles: string[];
        refactoringStatus: string;
        confidenceScore: number;
        proposedLayoutStructure: string[];
        componentPlacementMap: { componentName: string; region: string }[];
        safetyChecks: { checkName: string; passed: boolean }[];
      }[];
      validation: { decision: string; warnings: string[] };
    } | null;
  };
  live?: boolean;
};

/** T3-03 — Layout Refactoring development panel. */
export function DevelopmentLayoutRefactoringPanel() {
  const [data, setData] = useState<LayoutRefactoringPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/layout-refactoring", {
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as LayoutRefactoringPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Layout Refactoring");
    } finally {
      setLoading(false);
    }
  }, []);

  const runRefactor = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/layout-refactoring/refactor", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to refactor layouts");
    } finally {
      setRunning(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const snapshot = data?.layoutRefactoring;
  const report = snapshot?.latestReport;

  return (
    <div className="space-y-4">
      <Panel
        title="Layout Refactoring (T3-03)"
        description="Rebuilds EmpireAI layouts from approved UX intelligence and generated components."
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
              onClick={() => void runRefactor()}
              disabled={running}
            >
              {running ? "Refactoring…" : "Refactor Layouts"}
            </button>
          </div>
        }
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading && !snapshot ? (
          <p className="text-sm text-muted-foreground">Loading Layout Refactoring…</p>
        ) : snapshot ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Layouts</p>
              <p className="text-2xl font-bold">{snapshot.cockpit.layoutsCount}</p>
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
              <p className="text-xs text-muted-foreground">Total Refactorings</p>
              <p className="font-medium">{snapshot.cockpit.totalRefactorings}</p>
            </div>
          </div>
        ) : null}
      </Panel>

      {report && report.records.length > 0 ? (
        <>
          <Panel title="Refactoring Records" description={report.layoutRefactoringReportId}>
            <DataTable
              columns={[
                { key: "screen", header: "Screen" },
                { key: "status", header: "Status" },
                { key: "confidence", header: "Confidence" },
                { key: "placements", header: "Placements" },
              ]}
              rows={report.records.map((r) => ({
                screen: r.targetScreenId,
                status: r.refactoringStatus,
                confidence: String(r.confidenceScore),
                placements: String(r.componentPlacementMap.length),
              }))}
            />
          </Panel>
          <Panel title="Recent Logs" description="Layout refactoring activity">
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
