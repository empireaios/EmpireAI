"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type VisualConsistencyPayload = {
  visualConsistency?: {
    computedAt: string;
    engine: {
      status: string;
      performance: {
        totalReviews: number;
        totalFindingsDetected: number;
        totalStrengthsIdentified: number;
      };
      health: { status: string; healthScore: number };
    };
    readiness: {
      reviewStatus: string;
      lastDecision: string | null;
      healthScore: number;
    };
    cockpit: {
      reviewStatus: string;
      healthStatus: string;
      lastDecision: string | null;
      findingsCount: number;
      strengthsCount: number;
      severity: string | null;
      confidenceScore: number;
      totalReviews: number;
      recentLogs: string[];
    };
    latestReport: {
      reviewReportId: string;
      record: {
        consistencyReviewId: string;
        severity: string;
        confidenceScore: number;
        consistencyFindings: {
          findingCategory: string;
          findingDescription: string;
          severity: string;
          expectedPattern: string | null;
          observedPattern: string | null;
        }[];
        consistencyStrengths: {
          category: string;
          description: string;
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

/** T2-07 — Visual Consistency development panel. */
export function DevelopmentVisualConsistencyPanel() {
  const [data, setData] = useState<VisualConsistencyPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/visual-consistency", {
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as VisualConsistencyPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Visual Consistency");
    } finally {
      setLoading(false);
    }
  }, []);

  const runReview = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/visual-consistency/review", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run consistency review");
    } finally {
      setRunning(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const snapshot = data?.visualConsistency;
  const report = snapshot?.latestReport;

  return (
    <div className="space-y-4">
      <Panel
        title="Visual Consistency (T2-07)"
        description="Checks EmpireAI visual consistency and validates unified design language."
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
              onClick={() => void runReview()}
              disabled={running}
            >
              {running ? "Reviewing…" : "Run Review"}
            </button>
          </div>
        }
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading && !snapshot ? (
          <p className="text-sm text-muted-foreground">Loading Visual Consistency…</p>
        ) : snapshot ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="font-medium">{snapshot.engine.status}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Health</p>
              <p className="font-medium">{snapshot.cockpit.healthStatus}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Findings / Strengths</p>
              <p className="font-medium">
                {snapshot.cockpit.findingsCount} / {snapshot.cockpit.strengthsCount}
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
          <Panel title="Consistency Review" description={report.record.consistencyReviewId}>
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
                <p className="text-xs text-muted-foreground">Findings</p>
                <p className="text-sm">{report.record.consistencyFindings.length}</p>
              </div>
            </div>

            {report.record.consistencyFindings.length > 0 ? (
              <DataTable
                columns={[
                  { key: "category", header: "Category" },
                  { key: "severity", header: "Severity" },
                  { key: "description", header: "Finding" },
                  { key: "expected", header: "Expected" },
                  { key: "observed", header: "Observed" },
                ]}
                rows={report.record.consistencyFindings.map((f) => ({
                  category: f.findingCategory,
                  severity: f.severity,
                  description: f.findingDescription,
                  expected: f.expectedPattern ?? "—",
                  observed: f.observedPattern ?? "—",
                }))}
              />
            ) : null}
          </Panel>

          {report.record.consistencyStrengths.length > 0 ? (
            <Panel title="Consistency Strengths">
              <DataTable
                columns={[
                  { key: "category", header: "Category" },
                  { key: "description", header: "Strength" },
                ]}
                rows={report.record.consistencyStrengths.map((s) => ({
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
