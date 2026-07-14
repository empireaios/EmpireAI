"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type CertificationPayload = {
  visualFoundationCertification?: {
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
      t1CertificationStatus: string;
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

/** T1-10 — Visual Foundation Certification development panel. */
export function DevelopmentVisualFoundationCertificationPanel() {
  const [data, setData] = useState<CertificationPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/visual-foundation-certification", {
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as CertificationPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Visual Foundation Certification");
    } finally {
      setLoading(false);
    }
  }, []);

  const runCertification = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/visual-foundation-certification/run", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Certification run failed");
    } finally {
      setRunning(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const vfc = data?.visualFoundationCertification;
  const engine = vfc?.engine;
  const cockpit = vfc?.cockpit;
  const report = vfc?.latestReport;

  if (loading && !data) {
    return <Panel title="Visual Foundation Certification">Loading certification…</Panel>;
  }

  if (error) {
    return (
      <Panel title="Visual Foundation Certification" subtitle="T1-10 · Foundation validation">
        <p className="text-sm text-amber-200">{error}</p>
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      <Panel title="Visual Foundation Certification" subtitle="T1-10 · Pillow understands EmpireAI">
        <div className="flex flex-wrap items-center gap-2">
          <DataModeBadge mode={data?.live === false ? "sandbox" : "live"} />
          <span className="text-xs text-[#6f6a60]">
            Status: {engine?.status ?? cockpit?.certificationStatus ?? "unknown"}
          </span>
          <button
            type="button"
            onClick={() => void runCertification()}
            disabled={running}
            className="ml-auto rounded border border-[#d4af37]/40 px-3 py-1 text-xs text-[#d4af37] hover:bg-[#d4af37]/10 disabled:opacity-50"
          >
            {running ? "Running…" : "Run Certification"}
          </button>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-4 text-sm">
          <div>
            <p className="text-xs text-[#6f6a60]">Decision</p>
            <p className="text-[#d4af37]">
              {cockpit?.lastDecision ?? report?.finalCertificationDecision ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">Missions Passed</p>
            <p>{cockpit?.missionsPassed ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">E2E</p>
            <p>{cockpit?.endToEndPassed ?? report?.endToEndValidationResult.passed ? "PASS" : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">Data Safety</p>
            <p>
              {report?.dataSafetySummary.sensitiveMaskingActive === false
                ? "—"
                : report?.dataSafetySummary.sensitiveMaskingActive
                  ? "Active"
                  : "—"}
            </p>
          </div>
        </div>
      </Panel>

      {report?.missionResults && report.missionResults.length > 0 && (
        <Panel title="T1 Mission Validation">
          <DataTable
            columns={[
              { key: "mission", header: "Mission" },
              { key: "name", header: "Subsystem" },
              { key: "status", header: "Result" },
              { key: "health", header: "Health" },
            ]}
            rows={report.missionResults.map((m) => ({
              mission: m.missionId,
              name: m.missionName,
              status: m.passed ? "PASS" : "FAIL",
              health: m.healthStatus,
              key: m.missionId,
            }))}
          />
        </Panel>
      )}

      {cockpit?.recentLogs && cockpit.recentLogs.length > 0 && (
        <Panel title="Certification Logs">
          <DataTable
            columns={[{ key: "log", header: "Event" }]}
            rows={cockpit.recentLogs.map((log, i) => ({ log, key: String(i) }))}
          />
        </Panel>
      )}
    </div>
  );
}
