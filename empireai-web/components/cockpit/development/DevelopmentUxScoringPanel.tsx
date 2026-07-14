"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type UxScoringPayload = {
  uxScoring?: {
    computedAt: string;
    engine: {
      status: string;
      performance: {
        totalScorings: number;
        averageOverallScore: number;
      };
      health: { status: string; healthScore: number };
    };
    readiness: {
      scoringStatus: string;
      lastDecision: string | null;
      healthScore: number;
    };
    cockpit: {
      scoringStatus: string;
      healthStatus: string;
      lastDecision: string | null;
      overallUxScore: number;
      passThreshold: number;
      categoriesScored: number;
      confidenceScore: number;
      totalScorings: number;
      recentLogs: string[];
    };
    latestReport: {
      scoringReportId: string;
      record: {
        uxScoreId: string;
        overallUxScore: number;
        screenScore: number;
        componentScore: number;
        layoutScore: number;
        workflowScore: number;
        accessibilityScore: number;
        consistencyScore: number;
        executivePreferenceAlignmentScore: number;
        confidenceScore: number;
        scoreBreakdown: {
          category: string;
          score: number;
          weight: number;
          weightedScore: number;
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

/** T2-08 — UX Scoring development panel. */
export function DevelopmentUxScoringPanel() {
  const [data, setData] = useState<UxScoringPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/ux-scoring", {
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as UxScoringPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load UX Scoring");
    } finally {
      setLoading(false);
    }
  }, []);

  const runScoring = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/ux-scoring/score", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run UX scoring");
    } finally {
      setRunning(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const snapshot = data?.uxScoring;
  const report = snapshot?.latestReport;
  const record = report?.record;
  const passed =
    record && snapshot
      ? record.overallUxScore >= snapshot.cockpit.passThreshold
      : false;

  return (
    <div className="space-y-4">
      <Panel
        title="UX Scoring (T2-08)"
        description="Calculates measurable UX quality scores from UX intelligence findings."
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
              onClick={() => void runScoring()}
              disabled={running}
            >
              {running ? "Scoring…" : "Run Scoring"}
            </button>
          </div>
        }
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading && !snapshot ? (
          <p className="text-sm text-muted-foreground">Loading UX Scoring…</p>
        ) : snapshot ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Overall UX Score</p>
              <p className={`text-2xl font-bold ${passed ? "text-green-600" : "text-amber-600"}`}>
                {snapshot.cockpit.overallUxScore}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pass Threshold</p>
              <p className="font-medium">{snapshot.cockpit.passThreshold}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Categories Scored</p>
              <p className="font-medium">{snapshot.cockpit.categoriesScored}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Confidence</p>
              <p className="font-medium">{snapshot.cockpit.confidenceScore}</p>
            </div>
          </div>
        ) : null}
      </Panel>

      {record ? (
        <>
          <Panel title="Dimension Scores" description={record.uxScoreId}>
            <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
              {[
                { label: "Screen", value: record.screenScore },
                { label: "Component", value: record.componentScore },
                { label: "Layout", value: record.layoutScore },
                { label: "Workflow", value: record.workflowScore },
                { label: "Accessibility", value: record.accessibilityScore },
                { label: "Consistency", value: record.consistencyScore },
                { label: "Exec Pref", value: record.executivePreferenceAlignmentScore },
              ].map((d) => (
                <div key={d.label}>
                  <p className="text-xs text-muted-foreground">{d.label}</p>
                  <p className="font-medium">{d.value}</p>
                </div>
              ))}
            </div>
          </Panel>

          {record.scoreBreakdown.length > 0 ? (
            <Panel title="Score Breakdown">
              <DataTable
                columns={[
                  { key: "category", header: "Category" },
                  { key: "score", header: "Score" },
                  { key: "weight", header: "Weight" },
                  { key: "weighted", header: "Weighted" },
                ]}
                rows={record.scoreBreakdown.map((b) => ({
                  category: b.category,
                  score: b.score,
                  weight: b.weight,
                  weighted: b.weightedScore,
                }))}
              />
            </Panel>
          ) : null}

          {report ? (
            <Panel title="Validation">
              <p className="text-sm">
                Decision: <strong>{report.validation.decision}</strong>
              </p>
            </Panel>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
