"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type RegressionProtectionPayload = {
  regressionProtection?: {
    computedAt: string;
    engine: {
      status: string;
      performance: { totalChecks: number; blockedChanges: number };
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
      reportsCount: number;
      regressionsCount: number;
      blockedCount: number;
      confidenceScore: number;
      totalChecks: number;
      recentLogs: string[];
    };
    latestReport: {
      regressionRunReportId: string;
      reports: {
        regressionReportId: string;
        baselineUiStateId: string;
        proposedUiStateId: string;
        regressionStatus: string;
        detectedRegressions: {
          regressionId: string;
          regressionCategory: string;
          severity: string;
          regressionDescription: string;
        }[];
      }[];
      validation: { decision: string; regressionsDetected: number; warnings: string[] };
    } | null;
  };
  live?: boolean;
};

/** T3-07 — Regression Protection development panel. */
export function DevelopmentRegressionProtectionPanel() {
  const [data, setData] = useState<RegressionProtectionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/regression-protection", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as RegressionProtectionPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Regression Protection");
    } finally {
      setLoading(false);
    }
  }, []);

  const runCheck = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/regression-protection/check", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run regression check");
    } finally {
      setRunning(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const snapshot = data?.regressionProtection;
  const report = snapshot?.latestReport;
  const regressions = report?.reports.flatMap((r) => r.detectedRegressions) ?? [];

  return (
    <div className="space-y-4">
      <Panel
        title="Regression Protection (T3-07)"
        description="Compares proposed UI changes against known-good baselines to prevent UX regressions."
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
              onClick={() => void runCheck()}
              disabled={running}
            >
              {running ? "Checking…" : "Check Regressions"}
            </button>
          </div>
        }
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading && !snapshot ? (
          <p className="text-sm text-muted-foreground">Loading Regression Protection…</p>
        ) : snapshot ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Regressions</p>
              <p className="text-2xl font-bold">{snapshot.cockpit.regressionsCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Decision</p>
              <p className="font-medium">{snapshot.cockpit.lastDecision ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Blocked Changes</p>
              <p className="font-medium">{snapshot.cockpit.blockedCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Checks</p>
              <p className="font-medium">{snapshot.cockpit.totalChecks}</p>
            </div>
          </div>
        ) : null}
      </Panel>

      {regressions.length > 0 ? (
        <Panel title="Detected Regressions" description={report?.regressionRunReportId}>
          <DataTable
            columns={[
              { key: "category", header: "Category" },
              { key: "severity", header: "Severity" },
              { key: "description", header: "Description" },
            ]}
            rows={regressions.map((r) => ({
              category: r.regressionCategory,
              severity: r.severity,
              description: r.regressionDescription,
            }))}
          />
        </Panel>
      ) : null}

      {snapshot?.cockpit.recentLogs.length ? (
        <Panel title="Recent Logs" description="Regression protection activity">
          <ul className="space-y-1 text-sm text-muted-foreground">
            {snapshot.cockpit.recentLogs.map((log) => (
              <li key={log}>{log}</li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}
