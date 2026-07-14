"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type ValidationEnginePayload = {
  validationEngine?: {
    computedAt: string;
    engine: {
      status: string;
      performance: { totalValidations: number; blockedChanges: number };
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
      defectsCount: number;
      blockedCount: number;
      confidenceScore: number;
      totalValidations: number;
      recentLogs: string[];
    };
    latestReport: {
      validationRunReportId: string;
      reports: {
        validationReportId: string;
        sourcePreviewBuildId: string;
        validationStatus: string;
        detectedDefects: {
          defectId: string;
          defectCategory: string;
          severity: string;
          defectDescription: string;
        }[];
      }[];
      validation: { decision: string; defectsDetected: number; warnings: string[] };
    } | null;
  };
  live?: boolean;
};

/** T3-06 — Validation Engine development panel. */
export function DevelopmentValidationEnginePanel() {
  const [data, setData] = useState<ValidationEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/validation-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ValidationEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Validation Engine");
    } finally {
      setLoading(false);
    }
  }, []);

  const runValidation = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/validation-engine/validate", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run validation");
    } finally {
      setRunning(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const snapshot = data?.validationEngine;
  const report = snapshot?.latestReport;
  const defects = report?.reports.flatMap((r) => r.detectedDefects) ?? [];

  return (
    <div className="space-y-4">
      <Panel
        title="Validation Engine (T3-06)"
        description="Detects UI defects in preview builds before changes advance."
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
              {running ? "Validating…" : "Validate UI"}
            </button>
          </div>
        }
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading && !snapshot ? (
          <p className="text-sm text-muted-foreground">Loading Validation Engine…</p>
        ) : snapshot ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Defects</p>
              <p className="text-2xl font-bold">{snapshot.cockpit.defectsCount}</p>
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
              <p className="text-xs text-muted-foreground">Total Validations</p>
              <p className="font-medium">{snapshot.cockpit.totalValidations}</p>
            </div>
          </div>
        ) : null}
      </Panel>

      {defects.length > 0 ? (
        <Panel title="Detected Defects" description={report?.validationRunReportId}>
          <DataTable
            columns={[
              { key: "category", header: "Category" },
              { key: "severity", header: "Severity" },
              { key: "description", header: "Description" },
            ]}
            rows={defects.map((d) => ({
              category: d.defectCategory,
              severity: d.severity,
              description: d.defectDescription,
            }))}
          />
        </Panel>
      ) : null}

      {snapshot?.cockpit.recentLogs.length ? (
        <Panel title="Recent Logs" description="Validation engine activity">
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
