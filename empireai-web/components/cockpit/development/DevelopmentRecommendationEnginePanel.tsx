"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type RecommendationEnginePayload = {
  recommendationEngine?: {
    computedAt: string;
    engine: {
      status: string;
      performance: {
        totalReports: number;
        totalProposalsGenerated: number;
      };
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
      proposalsCount: number;
      criticalCount: number;
      highPriorityCount: number;
      confidenceScore: number;
      totalReports: number;
      recentLogs: string[];
    };
    latestReport: {
      recommendationReportId: string;
      record: {
        recommendationRecordId: string;
        proposals: {
          recommendationId: string;
          recommendationCategory: string;
          recommendationTitle: string;
          recommendationDescription: string;
          priority: string;
          severity: string;
          confidenceScore: number;
          expectedUxBenefit: string;
          evidenceReferences: string[];
        }[];
        overallPriority: string;
        confidenceScore: number;
      };
      validation: {
        decision: string;
        warnings: string[];
      };
    } | null;
  };
  live?: boolean;
};

/** T2-09 — Recommendation Engine development panel. */
export function DevelopmentRecommendationEnginePanel() {
  const [data, setData] = useState<RecommendationEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/recommendations", {
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as RecommendationEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Recommendation Engine");
    } finally {
      setLoading(false);
    }
  }, []);

  const generateRecommendations = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/recommendations/generate", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate recommendations");
    } finally {
      setRunning(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const snapshot = data?.recommendationEngine;
  const report = snapshot?.latestReport;
  const record = report?.record;

  return (
    <div className="space-y-4">
      <Panel
        title="Recommendation Engine (T2-09)"
        description="Generates actionable redesign proposals from UX intelligence findings."
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
              onClick={() => void generateRecommendations()}
              disabled={running}
            >
              {running ? "Generating…" : "Generate Proposals"}
            </button>
          </div>
        }
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading && !snapshot ? (
          <p className="text-sm text-muted-foreground">Loading Recommendation Engine…</p>
        ) : snapshot ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Proposals</p>
              <p className="text-2xl font-bold">{snapshot.cockpit.proposalsCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Critical / High</p>
              <p className="font-medium">
                {snapshot.cockpit.criticalCount} / {snapshot.cockpit.highPriorityCount}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Confidence</p>
              <p className="font-medium">{snapshot.cockpit.confidenceScore}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Reports</p>
              <p className="font-medium">{snapshot.cockpit.totalReports}</p>
            </div>
          </div>
        ) : null}
      </Panel>

      {record && record.proposals.length > 0 ? (
        <>
          <Panel
            title="Redesign Proposals"
            description={`${record.recommendationRecordId} · ${record.overallPriority} priority`}
          >
            <DataTable
              columns={[
                { key: "title", header: "Title" },
                { key: "category", header: "Category" },
                { key: "priority", header: "Priority" },
                { key: "confidence", header: "Confidence" },
                { key: "evidence", header: "Evidence" },
              ]}
              rows={record.proposals.map((p) => ({
                title: p.recommendationTitle,
                category: p.recommendationCategory,
                priority: p.priority,
                confidence: p.confidenceScore,
                evidence: p.evidenceReferences.length,
              }))}
            />
          </Panel>

          <Panel title="Top Proposal Detail" description={record.proposals[0]?.recommendationId}>
            <p className="text-sm font-medium">{record.proposals[0]?.recommendationTitle}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {record.proposals[0]?.recommendationDescription}
            </p>
            <p className="mt-2 text-sm">
              Expected benefit: {record.proposals[0]?.expectedUxBenefit}
            </p>
          </Panel>
        </>
      ) : record ? (
        <Panel title="Redesign Proposals">
          <p className="text-sm text-muted-foreground">
            No proposals generated — upstream UX intelligence may have no actionable findings.
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
