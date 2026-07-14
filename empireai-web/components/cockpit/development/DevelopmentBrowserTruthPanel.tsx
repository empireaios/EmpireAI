"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type BrowserTruthPayload = {
  browserTruth: {
    computedAt: string;
    cockpit: {
      productionStatus: string;
      browserValidationStatus: string;
      latestBrowserTests: string[];
      latestProductionVerification: string;
      grandKingAcceptance: string;
      regressionAlerts: string[];
      knownBrowserIssues: string[];
      productionUrl: string;
    };
    metrics: {
      validationPassRate: number;
      failedBrowserChecks: number;
      regressionRate: number;
      productionAcceptanceRate: number;
      grandKingAcceptanceRate: number;
      trend: string;
    };
    readiness: {
      readinessScore: number;
      steps: Array<{ label: string; status: string; summary: string }>;
    };
  };
};

/** P4-06 — Browser Truth Cockpit panel. */
export function DevelopmentBrowserTruthPanel() {
  const [data, setData] = useState<BrowserTruthPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/browser-truth", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as BrowserTruthPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Browser Truth");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <Panel title="Browser Truth">Loading browser acceptance state…</Panel>;
  }

  if (error || !data) {
    return (
      <Panel title="Browser Truth">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void load()}>
          Retry
        </button>
      </Panel>
    );
  }

  const { cockpit, metrics, readiness } = data.browserTruth;

  return (
    <div className="space-y-6">
      <Panel title="Browser Truth Status" subtitle="P4-06 · PILLOW-BT-001">
        <DataModeBadge mode="live" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-white/50">Production Status</p>
            <p className="text-sm font-medium text-white">{cockpit.productionStatus}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Browser Validation</p>
            <p className="text-sm font-medium text-white">{cockpit.browserValidationStatus}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Grand King Acceptance</p>
            <p className="text-sm font-medium text-white">{cockpit.grandKingAcceptance}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Production URL</p>
            <p className="text-sm font-medium text-white">{cockpit.productionUrl}</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-white/70">
          Latest verification: {cockpit.latestProductionVerification}
        </p>
      </Panel>

      <Panel title="Acceptance Readiness">
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
          Readiness: {readiness.readinessScore}/100 · Mission complete requires Repository PASS ·
          Production PASS · Grand King PASS
        </p>
      </Panel>
    </div>
  );
}
