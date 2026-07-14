"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type CertificationPayload = {
  executiveCollaborationCertification?: {
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
      missionId: string;
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
      t4CertificationStatus: string;
      missionResults: {
        missionId: string;
        missionName: string;
        passed: boolean;
        healthStatus: string;
      }[];
      endToEndValidationResult: { passed: boolean; summary: string };
      governanceSummary: {
        grandKingAuthorityPreserved: boolean;
        approvalRequiredBeforeUxChanges: boolean;
        noAutomaticApprovals: boolean;
        noAutomaticUxExecution: boolean;
      };
    } | null;
  };
  live?: boolean;
};

/** T4-10 — Executive Collaboration Certification development panel. */
export function DevelopmentExecutiveCollaborationCertificationPanel() {
  const [data, setData] = useState<CertificationPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-collaboration-certification", {
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as CertificationPayload);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load Executive Collaboration Certification",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const runCertification = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-collaboration-certification/run", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to run Executive Collaboration certification",
      );
    } finally {
      setRunning(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const snapshot = data?.executiveCollaborationCertification;
  const report = snapshot?.latestReport;

  return (
    <div className="space-y-4">
      <Panel
        title="Executive Collaboration Certification (T4-10)"
        description="Validates T4-01 through T4-09 — Grand King authority, approval workflow, and natural collaboration."
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
              {running ? "Certifying…" : "Run certification"}
            </button>
          </div>
        }
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading && !snapshot ? (
          <p className="text-sm text-muted-foreground">Loading certification…</p>
        ) : snapshot ? (
          <div className="mt-3 space-y-3">
            <DataTable
              columns={["Metric", "Value"]}
              rows={[
                ["Mission", snapshot.readiness.missionId],
                ["Status", snapshot.engine.status],
                ["Health", `${snapshot.engine.health.status} (${snapshot.engine.health.healthScore})`],
                ["Missions passed", String(snapshot.cockpit.missionsPassed)],
                ["Missions failed", String(snapshot.cockpit.missionsFailed)],
                ["E2E passed", String(snapshot.cockpit.endToEndPassed)],
                ["Last decision", snapshot.cockpit.lastDecision ?? "—"],
              ]}
            />
            {report ? (
              <>
                <p className="text-sm text-muted-foreground">
                  {report.certificationReportId} · {report.finalCertificationDecision} ·{" "}
                  {report.t4CertificationStatus}
                </p>
                <DataTable
                  columns={["Mission", "Name", "Result", "Health"]}
                  rows={report.missionResults.map((m) => [
                    m.missionId,
                    m.missionName,
                    m.passed ? "PASS" : "FAIL",
                    m.healthStatus,
                  ])}
                />
                <p className="text-xs text-muted-foreground">
                  E2E: {report.endToEndValidationResult.summary}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No certification run yet — click Run certification.
              </p>
            )}
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
