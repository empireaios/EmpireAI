"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type UxRuleEnginePayload = {
  uxRuleEngine?: {
    computedAt: string;
    engine: {
      status: string;
      rulesLoaded: number;
      rulesEnabled: number;
      performance: {
        totalValidations: number;
        successfulValidations: number;
        failedValidations: number;
        totalViolations: number;
      };
      health: { status: string; healthScore: number };
    };
    readiness: {
      engineStatus: string;
      lastDecision: string | null;
      healthScore: number;
    };
    cockpit: {
      engineStatus: string;
      healthStatus: string;
      rulesLoaded: number;
      rulesEnabled: number;
      lastDecision: string | null;
      violationsCount: number;
      totalValidations: number;
      recentLogs: string[];
    };
    latestReport: {
      validationReportId: string;
      decision: string;
      rulesEvaluated: number;
      rulesPassed: number;
      rulesFailed: number;
      violations: {
        ruleId: string;
        ruleName: string;
        severity: string;
        violationDescription: string;
      }[];
    } | null;
  };
  live?: boolean;
};

/** T2-01 — UX Rule Engine development panel. */
export function DevelopmentUxRuleEnginePanel() {
  const [data, setData] = useState<UxRuleEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/ux-rule-engine", {
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as UxRuleEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load UX Rule Engine");
    } finally {
      setLoading(false);
    }
  }, []);

  const runValidation = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/ux-rule-engine/validate", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run UX rule validation");
    } finally {
      setRunning(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const snapshot = data?.uxRuleEngine;
  const report = snapshot?.latestReport;

  return (
    <div className="space-y-4">
      <Panel
        title="UX Rule Engine (T2-01)"
        description="Design governance — validates UI states, components, layouts, and navigation against UX standards."
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
              onClick={() => void runValidation()}
              disabled={running}
            >
              {running ? "Validating…" : "Run Validation"}
            </button>
          </div>
        }
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading && !snapshot ? (
          <p className="text-sm text-muted-foreground">Loading UX Rule Engine…</p>
        ) : snapshot ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="font-medium">{snapshot.engine.status}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rules</p>
              <p className="font-medium">
                {snapshot.engine.rulesEnabled}/{snapshot.engine.rulesLoaded} enabled
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Health</p>
              <p className="font-medium">
                {snapshot.engine.health.status} ({snapshot.engine.health.healthScore})
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last Decision</p>
              <p className="font-medium">{snapshot.readiness.lastDecision ?? "—"}</p>
            </div>
          </div>
        ) : null}
      </Panel>

      {report ? (
        <Panel title="Latest Validation Report" description={report.validationReportId}>
          <div className="mb-4 grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Decision</p>
              <p className="font-medium uppercase">{report.decision}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Evaluated</p>
              <p className="font-medium">{report.rulesEvaluated}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Passed</p>
              <p className="font-medium text-green-600">{report.rulesPassed}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Failed</p>
              <p className="font-medium text-amber-600">{report.rulesFailed}</p>
            </div>
          </div>
          {report.violations.length > 0 ? (
            <DataTable
              columns={[
                { key: "ruleId", header: "Rule" },
                { key: "severity", header: "Severity" },
                { key: "violationDescription", header: "Description" },
              ]}
              rows={report.violations.map((v) => ({
                ruleId: v.ruleId,
                severity: v.severity,
                violationDescription: v.violationDescription,
              }))}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No violations in latest report.</p>
          )}
        </Panel>
      ) : null}

      {snapshot?.cockpit.recentLogs?.length ? (
        <Panel title="Recent Logs">
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
