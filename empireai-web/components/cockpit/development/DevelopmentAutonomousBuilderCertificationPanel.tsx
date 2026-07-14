"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type CertificationPayload = {
  autonomousBuilderCertification?: {
    computedAt: string;
    engine: {
      status: string;
      performance: {
        totalCertifications: number;
        successfulCertifications: number;
        failedCertifications: number;
      };
      health: { status: string; healthScore: number };
    };
    readiness: {
      certificationStatus: string;
      lastDecision: string | null;
      healthScore: number;
    };
    cockpit: {
      certificationStatus: string;
      healthStatus: string;
      lastDecision: string | null;
      missionsPassed: number;
      missionsFailed: number;
      endToEndPassed: boolean;
      totalCertifications: number;
      recentLogs: string[];
    };
    latestReport: {
      certificationReportId: string;
      finalCertificationDecision: string;
      t3CertificationStatus: string;
      missionResults: {
        missionId: string;
        missionName: string;
        passed: boolean;
        healthStatus: string;
      }[];
      endToEndValidationResult: { passed: boolean; summary: string };
      productionSafetySummary: {
        productionSafetyVerified: boolean;
        rollbackCapabilityAvailable: boolean;
        documentationComplete: boolean;
      };
    } | null;
  };
  live?: boolean;
};

/** T3-10 — Autonomous Builder Certification development panel. */
export function DevelopmentAutonomousBuilderCertificationPanel() {
  const [data, setData] = useState<CertificationPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/autonomous-builder-certification", {
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as CertificationPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Autonomous Builder Certification");
    } finally {
      setLoading(false);
    }
  }, []);

  const runCertification = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/autonomous-builder-certification/run", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run Autonomous Builder certification");
    } finally {
      setRunning(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const snapshot = data?.autonomousBuilderCertification;
  const report = snapshot?.latestReport;
  const certified = report?.finalCertificationDecision === "pass";

  return (
    <div className="space-y-4">
      <Panel
        title="Autonomous Builder Certification (T3-10)"
        description="Validates the complete T3 Autonomous Builder pipeline — Pillow safely implements UX improvements."
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
              onClick={() => void runCertification()}
              disabled={running}
            >
              {running ? "Certifying…" : "Run Certification"}
            </button>
          </div>
        }
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading && !snapshot ? (
          <p className="text-sm text-muted-foreground">Loading Autonomous Builder Certification…</p>
        ) : snapshot ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-2xl font-bold">
                {certified ? "Certified" : snapshot.cockpit.lastDecision ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Missions Passed</p>
              <p className="font-medium">
                {snapshot.cockpit.missionsPassed}/{snapshot.cockpit.missionsPassed + snapshot.cockpit.missionsFailed}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">E2E</p>
              <p className="font-medium">{snapshot.cockpit.endToEndPassed ? "Pass" : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Runs</p>
              <p className="font-medium">{snapshot.cockpit.totalCertifications}</p>
            </div>
          </div>
        ) : null}
      </Panel>

      {report && report.missionResults.length > 0 ? (
        <Panel title="Mission Results" description={report.certificationReportId}>
          <DataTable
            columns={[
              { key: "mission", header: "Mission" },
              { key: "name", header: "Name" },
              { key: "passed", header: "Passed" },
              { key: "health", header: "Health" },
            ]}
            rows={report.missionResults.map((r) => ({
              mission: r.missionId,
              name: r.missionName,
              passed: r.passed ? "Yes" : "No",
              health: r.healthStatus,
            }))}
          />
        </Panel>
      ) : null}

      {snapshot?.cockpit.recentLogs.length ? (
        <Panel title="Recent Logs" description="Certification activity">
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
