"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type AccessibilityIntelligencePayload = {
  accessibilityIntelligence?: {
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
        accessibilityReviewId: string;
        severity: string;
        confidenceScore: number;
        accessibilityFindings: {
          findingCategory: string;
          findingDescription: string;
          severity: string;
        }[];
        accessibilityStrengths: {
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

/** T2-06 — Accessibility Intelligence development panel. */
export function DevelopmentAccessibilityIntelligencePanel() {
  const [data, setData] = useState<AccessibilityIntelligencePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/accessibility-intelligence", {
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as AccessibilityIntelligencePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Accessibility Intelligence");
    } finally {
      setLoading(false);
    }
  }, []);

  const runReview = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/accessibility-intelligence/review", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run accessibility review");
    } finally {
      setRunning(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const snapshot = data?.accessibilityIntelligence;
  const report = snapshot?.latestReport;

  return (
    <div className="space-y-4">
      <Panel
        title="Accessibility Intelligence (T2-06)"
        description="Reviews EmpireAI interface accessibility and produces inclusive UX findings."
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
          <p className="text-sm text-muted-foreground">Loading Accessibility Intelligence…</p>
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
          <Panel title="Accessibility Review" description={report.record.accessibilityReviewId}>
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
                <p className="text-sm">{report.record.accessibilityFindings.length}</p>
              </div>
            </div>

            {report.record.accessibilityFindings.length > 0 ? (
              <DataTable
                columns={[
                  { key: "category", header: "Category" },
                  { key: "severity", header: "Severity" },
                  { key: "description", header: "Finding" },
                ]}
                rows={report.record.accessibilityFindings.map((f) => ({
                  category: f.findingCategory,
                  severity: f.severity,
                  description: f.findingDescription,
                }))}
              />
            ) : null}
          </Panel>

          {report.record.accessibilityStrengths.length > 0 ? (
            <Panel title="Accessibility Strengths">
              <DataTable
                columns={[
                  { key: "category", header: "Category" },
                  { key: "description", header: "Strength" },
                ]}
                rows={report.record.accessibilityStrengths.map((s) => ({
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
