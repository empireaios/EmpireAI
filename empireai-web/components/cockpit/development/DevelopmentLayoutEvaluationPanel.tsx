"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type LayoutEvaluationPayload = {
  layoutEvaluation?: {
    computedAt: string;
    engine: {
      status: string;
      performance: {
        totalEvaluations: number;
        totalStrengthsIdentified: number;
        totalWeaknessesIdentified: number;
        totalRuleViolations: number;
      };
      health: { status: string; healthScore: number };
    };
    readiness: {
      evaluationStatus: string;
      lastDecision: string | null;
      healthScore: number;
    };
    cockpit: {
      evaluationStatus: string;
      healthStatus: string;
      lastDecision: string | null;
      overallStatus: string | null;
      strengthsCount: number;
      weaknessesCount: number;
      ruleViolationsCount: number;
      confidenceScore: number;
      totalEvaluations: number;
      recentLogs: string[];
    };
    latestReport: {
      evaluationReportId: string;
      model: {
        evaluationId: string;
        overallEvaluationStatus: string;
        confidenceScore: number;
        layoutStrengths: { category: string; description: string }[];
        layoutWeaknesses: { category: string; description: string; severity: string }[];
        ruleViolations: { ruleName: string; violationDescription: string }[];
        designSystemDeviations: { category: string; description: string }[];
        executivePreferenceDeviations: { category: string; description: string }[];
      };
      validation: {
        decision: string;
        warnings: string[];
      };
    } | null;
  };
  live?: boolean;
};

/** T2-04 — Layout Evaluation development panel. */
export function DevelopmentLayoutEvaluationPanel() {
  const [data, setData] = useState<LayoutEvaluationPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/layout-evaluation", {
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as LayoutEvaluationPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Layout Evaluation");
    } finally {
      setLoading(false);
    }
  }, []);

  const runEvaluation = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/layout-evaluation/evaluate", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run layout evaluation");
    } finally {
      setRunning(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const snapshot = data?.layoutEvaluation;
  const report = snapshot?.latestReport;

  return (
    <div className="space-y-4">
      <Panel
        title="Layout Evaluation (T2-04)"
        description="Automatically evaluates layouts and detects UX weaknesses."
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
              onClick={() => void runEvaluation()}
              disabled={running}
            >
              {running ? "Evaluating…" : "Run Evaluation"}
            </button>
          </div>
        }
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading && !snapshot ? (
          <p className="text-sm text-muted-foreground">Loading Layout Evaluation…</p>
        ) : snapshot ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="font-medium">{snapshot.engine.status}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Overall</p>
              <p className="font-medium">{snapshot.cockpit.overallStatus ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Strengths / Weaknesses</p>
              <p className="font-medium">
                {snapshot.cockpit.strengthsCount} / {snapshot.cockpit.weaknessesCount}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rule Violations</p>
              <p className="font-medium">{snapshot.cockpit.ruleViolationsCount}</p>
            </div>
          </div>
        ) : null}
      </Panel>

      {report ? (
        <>
          <Panel title="Evaluation Report" description={report.model.evaluationId}>
            <div className="mb-4 grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Decision</p>
                <p className="text-sm">{report.validation.decision}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Confidence</p>
                <p className="text-sm">{report.model.confidenceScore}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-sm">{report.model.overallEvaluationStatus}</p>
              </div>
            </div>

            {report.model.layoutWeaknesses.length > 0 ? (
              <DataTable
                columns={[
                  { key: "category", header: "Category" },
                  { key: "severity", header: "Severity" },
                  { key: "description", header: "Weakness" },
                ]}
                rows={report.model.layoutWeaknesses.map((w) => ({
                  category: w.category,
                  severity: w.severity,
                  description: w.description,
                }))}
              />
            ) : null}
          </Panel>

          {report.model.layoutStrengths.length > 0 ? (
            <Panel title="Layout Strengths">
              <DataTable
                columns={[
                  { key: "category", header: "Category" },
                  { key: "description", header: "Strength" },
                ]}
                rows={report.model.layoutStrengths.map((s) => ({
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
