"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type ExecutiveStylePayload = {
  executiveStyleLearning?: {
    computedAt: string;
    engine: {
      status: string;
      performance: {
        totalApprovals: number;
        totalRejections: number;
        totalLearningRuns: number;
      };
      health: { status: string; healthScore: number };
    };
    readiness: {
      learningStatus: string;
      lastDecision: string | null;
      healthScore: number;
    };
    cockpit: {
      learningStatus: string;
      healthStatus: string;
      preferenceModelVersion: string | null;
      preferencesLearned: number;
      confidenceScore: number;
      lastDecision: string | null;
      totalApprovals: number;
      totalRejections: number;
      recentLogs: string[];
    };
    latestReport: {
      learningReportId: string;
      model: {
        executiveStyleId: string;
        preferenceModelVersion: string;
        preferredLayoutStyles: string[];
        preferredTypography: string[];
        preferredColorPreferences: string[];
        preferredSpacingPreferences: string[];
        preferredNavigationStyles: string[];
        preferredDashboardOrganization: string[];
        confidenceScore: number;
      };
      preferences: {
        preferenceCategory: string;
        preferenceDescription: string;
        preferenceValue: string;
        learningConfidence: number;
        currentStatus: string;
      }[];
      validation: {
        decision: string;
        warnings: string[];
      };
    } | null;
  };
  live?: boolean;
};

/** T2-03 — Executive Style Learning development panel. */
export function DevelopmentExecutiveStyleLearningPanel() {
  const [data, setData] = useState<ExecutiveStylePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-style-learning", {
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutiveStylePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Style Learning");
    } finally {
      setLoading(false);
    }
  }, []);

  const runLearning = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-style-learning/learn", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run executive style learning");
    } finally {
      setRunning(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const snapshot = data?.executiveStyleLearning;
  const report = snapshot?.latestReport;

  return (
    <div className="space-y-4">
      <Panel
        title="Executive Style Learning (T2-03)"
        description="Learns the Grand King's UX preferences from approved and rejected design decisions."
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
              onClick={() => void runLearning()}
              disabled={running}
            >
              {running ? "Learning…" : "Run Learning"}
            </button>
          </div>
        }
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading && !snapshot ? (
          <p className="text-sm text-muted-foreground">Loading Executive Style Learning…</p>
        ) : snapshot ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="font-medium">{snapshot.engine.status}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Model Version</p>
              <p className="font-medium">{snapshot.cockpit.preferenceModelVersion ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Preferences</p>
              <p className="font-medium">
                {snapshot.cockpit.preferencesLearned} learned · confidence {snapshot.cockpit.confidenceScore}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Approvals / Rejections</p>
              <p className="font-medium">
                {snapshot.cockpit.totalApprovals} / {snapshot.cockpit.totalRejections}
              </p>
            </div>
          </div>
        ) : null}
      </Panel>

      {report ? (
        <>
          <Panel title="Executive Style Model" description={report.model.executiveStyleId}>
            <div className="mb-4 grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Typography</p>
                <p className="text-sm">{report.model.preferredTypography.join(", ") || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Layout</p>
                <p className="text-sm">{report.model.preferredLayoutStyles.join(", ") || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Validation</p>
                <p className="text-sm">{report.validation.decision}</p>
              </div>
            </div>
            <DataTable
              columns={[
                { key: "preferenceCategory", header: "Category" },
                { key: "preferenceValue", header: "Value" },
                { key: "learningConfidence", header: "Confidence" },
                { key: "currentStatus", header: "Status" },
              ]}
              rows={report.preferences.map((p) => ({
                preferenceCategory: p.preferenceCategory,
                preferenceValue: p.preferenceValue,
                learningConfidence: p.learningConfidence.toFixed(2),
                currentStatus: p.currentStatus,
              }))}
            />
          </Panel>

          {snapshot?.cockpit.recentLogs.length ? (
            <Panel title="Recent Learning Logs">
              <ul className="space-y-1 text-sm text-muted-foreground">
                {snapshot.cockpit.recentLogs.map((log) => (
                  <li key={log}>{log}</li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
