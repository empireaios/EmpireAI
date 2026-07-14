"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type E2eTestingPayload = {
  e2eTesting: {
    computedAt: string;
    cockpit: {
      currentTestStatus: string;
      passRate: number;
      criticalFailures: string[];
      coverage: number;
      latestBrowserTests: string[];
      latestProductionTests: string[];
      acceptanceStatus: string;
      browserTruthAuthority: string;
      engineStatus: string;
      analysis: {
        recurringFailures: string[];
        coverageGaps: string[];
        recommendations: string[];
      };
    };
    metrics: {
      passRate: number;
      criticalFailures: number;
      regressionCount: number;
      coverageEstimate: number;
      trend: string;
    };
    readiness: {
      readinessScore: number;
      steps: Array<{ label: string; status: string; summary: string }>;
    };
  };
};

/** P4-07 — End-to-End Testing Cockpit panel. */
export function DevelopmentTestingPanel() {
  const [data, setData] = useState<E2eTestingPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/e2e-testing", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as E2eTestingPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load E2E Testing");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <Panel title="Testing">Loading E2E testing state…</Panel>;
  }

  if (error || !data) {
    return (
      <Panel title="Testing">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void load()}>
          Retry
        </button>
      </Panel>
    );
  }

  const { cockpit, metrics, readiness } = data.e2eTesting;

  return (
    <div className="space-y-6">
      <Panel title="Testing Status" subtitle="P4-07 · PILLOW-E2E-001">
        <DataModeBadge mode="live" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-white/50">Current Status</p>
            <p className="text-sm font-medium text-white">{cockpit.currentTestStatus}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Pass Rate</p>
            <p className="text-sm font-medium text-white">{Math.round(cockpit.passRate * 100)}%</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Coverage</p>
            <p className="text-sm font-medium text-white">{Math.round(cockpit.coverage * 100)}%</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Browser Truth Authority</p>
            <p className="text-sm font-medium text-white">{cockpit.browserTruthAuthority}</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-white/70">{cockpit.acceptanceStatus}</p>
      </Panel>

      <Panel title="E2E Readiness">
        <DataTable
          columns={[
            { key: "label", header: "Check" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={readiness.steps.map((s) => ({
            label: s.label,
            status: s.status,
            summary: s.summary,
          }))}
        />
        <p className="mt-3 text-xs text-white/50">
          Readiness: {readiness.readinessScore}/100 · Trend: {metrics.trend}
        </p>
      </Panel>

      {cockpit.criticalFailures.length > 0 && (
        <Panel title="Critical Failures">
          <ul className="list-disc pl-5 text-sm text-red-200">
            {cockpit.criticalFailures.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </Panel>
      )}

      {cockpit.analysis.recommendations.length > 0 && (
        <Panel title="Pillow Testing Recommendations">
          <ul className="list-disc pl-5 text-sm text-white/70">
            {cockpit.analysis.recommendations.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
