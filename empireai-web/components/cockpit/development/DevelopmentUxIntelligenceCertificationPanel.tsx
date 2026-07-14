"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type CertificationPayload = {
  uxIntelligenceCertification?: {
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
      t2CertificationStatus: string;
      missionResults: {
        missionId: string;
        missionName: string;
        passed: boolean;
        healthStatus: string;
      }[];
      endToEndValidationResult: { passed: boolean; summary: string };
      dataSafetySummary: { sensitiveMaskingActive: boolean };
    } | null;
  };
  live?: boolean;
};

/** T2-10 — UX Intelligence Certification development panel. */
export function DevelopmentUxIntelligenceCertificationPanel() {
  const [data, setData] = useState<CertificationPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/ux-intelligence-certification", {
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as CertificationPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load UX Intelligence Certification");
    } finally {
      setLoading(false);
    }
  }, []);

  const runCertification = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/ux-intelligence-certification/run", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run UX Intelligence certification");
    } finally {
      setRunning(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const snapshot = data?.uxIntelligenceCertification;
  const report = snapshot?.latestReport;
  const certified = report?.finalCertificationDecision === "pass";

  return (
    <div className="space-y-4">
      <Panel
        title="UX Intelligence Certification (T2-10)"
        description="Validates the complete T2 UX Intelligence pipeline — Pillow knows what good UX looks like."
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
          <p className="text-sm text-muted-foreground">Loading UX Intelligence Certification…</p>
        ) : snapshot ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Certification Status</p>
              <p className={`text-2xl font-bold ${certified ? "text-green-600" : "text-amber-600"}`}>
                {snapshot.cockpit.certificationStatus}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Missions Passed</p>
              <p className="font-medium">
                {snapshot.cockpit.missionsPassed} /{" "}
                {snapshot.cockpit.missionsPassed + snapshot.cockpit.missionsFailed}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">E2E Pipeline</p>
              <p className="font-medium">
                {snapshot.cockpit.endToEndPassed ? "Passed" : "Not passed"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Certifications</p>
              <p className="font-medium">{snapshot.cockpit.totalCertifications}</p>
            </div>
          </div>
        ) : null}
      </Panel>

      {report ? (
        <>
          <Panel
            title="Mission Validation"
            description={`${report.certificationReportId} · ${report.finalCertificationDecision}`}
          >
            <DataTable
              columns={[
                { key: "mission", header: "Mission" },
                { key: "name", header: "Subsystem" },
                { key: "passed", header: "Passed" },
                { key: "health", header: "Health" },
              ]}
              rows={report.missionResults.map((m) => ({
                mission: m.missionId,
                name: m.missionName,
                passed: m.passed ? "Yes" : "No",
                health: m.healthStatus,
              }))}
            />
          </Panel>

          <Panel title="End-to-End Validation">
            <p className="text-sm">
              Result:{" "}
              <strong>{report.endToEndValidationResult.passed ? "PASS" : "FAIL"}</strong>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {report.endToEndValidationResult.summary}
            </p>
          </Panel>

          <Panel title="Data Safety">
            <p className="text-sm">
              Sensitive masking active:{" "}
              <strong>{report.dataSafetySummary.sensitiveMaskingActive ? "Yes" : "No"}</strong>
            </p>
          </Panel>
        </>
      ) : null}
    </div>
  );
}
