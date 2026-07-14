"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type WorkflowOptimizationPayload = {
  workflowOptimization?: {
    computedAt: string;
    engine: {
      status: string;
      performance: {
        totalAnalyses: number;
        totalFrictionPoints: number;
        totalStrengthsIdentified: number;
      };
      health: { status: string; healthScore: number };
    };
    readiness: {
      optimizationStatus: string;
      lastDecision: string | null;
      healthScore: number;
    };
    cockpit: {
      optimizationStatus: string;
      healthStatus: string;
      lastDecision: string | null;
      frictionPointsCount: number;
      strengthsCount: number;
      workflowName: string | null;
      confidenceScore: number;
      totalAnalyses: number;
      recentLogs: string[];
    };
    latestReport: {
      optimizationReportId: string;
      record: {
        optimizationRecordId: string;
        currentWorkflowName: string | null;
        severity: string;
        confidenceScore: number;
        detectedFrictionPoints: {
          category: string;
          description: string;
          severity: string;
        }[];
        detectedWorkflowStrengths: {
          description: string;
          category: string;
        }[];
      };
      validation: {
        decision: string;
        warnings: string[];
      };
    } | null;
  };
  live?: boolean;
};

/** T2-05 — Workflow Optimization development panel. */
export function DevelopmentWorkflowOptimizationPanel() {
  const [data, setData] = useState<WorkflowOptimizationPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/workflow-optimization", {
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as WorkflowOptimizationPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Workflow Optimization");
    } finally {
      setLoading(false);
    }
  }, []);

  const runAnalysis = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/workflow-optimization/analyze", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run workflow analysis");
    } finally {
      setRunning(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const snapshot = data?.workflowOptimization;
  const report = snapshot?.latestReport;

  return (
    <div className="space-y-4">
      <Panel
        title="Workflow Optimization (T2-05)"
        description="Analyzes EmpireAI workflows and identifies usability friction."
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
              onClick={() => void runAnalysis()}
              disabled={running}
            >
              {running ? "Analyzing…" : "Run Analysis"}
            </button>
          </div>
        }
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading && !snapshot ? (
          <p className="text-sm text-muted-foreground">Loading Workflow Optimization…</p>
        ) : snapshot ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="font-medium">{snapshot.engine.status}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Workflow</p>
              <p className="font-medium">{snapshot.cockpit.workflowName ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Friction / Strengths</p>
              <p className="font-medium">
                {snapshot.cockpit.frictionPointsCount} / {snapshot.cockpit.strengthsCount}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Confidence</p>
              <p className="font-medium">{snapshot.cockpit.confidenceScore}</p>
            </div>
          </div>
        ) : null}
      </Panel>

      {report ? (
        <>
          <Panel title="Optimization Report" description={report.record.optimizationRecordId}>
            <div className="mb-4 grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Decision</p>
                <p className="text-sm">{report.validation.decision}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Severity</p>
                <p className="text-sm">{report.record.severity}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Friction Points</p>
                <p className="text-sm">{report.record.detectedFrictionPoints.length}</p>
              </div>
            </div>

            {report.record.detectedFrictionPoints.length > 0 ? (
              <DataTable
                columns={[
                  { key: "category", header: "Category" },
                  { key: "severity", header: "Severity" },
                  { key: "description", header: "Friction" },
                ]}
                rows={report.record.detectedFrictionPoints.map((f) => ({
                  category: f.category,
                  severity: f.severity,
                  description: f.description,
                }))}
              />
            ) : null}
          </Panel>

          {report.record.detectedWorkflowStrengths.length > 0 ? (
            <Panel title="Workflow Strengths">
              <DataTable
                columns={[
                  { key: "category", header: "Category" },
                  { key: "description", header: "Strength" },
                ]}
                rows={report.record.detectedWorkflowStrengths.map((s) => ({
                  category: s.category,
                  description: s.description,
                }))}
              />
            </Panel>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
