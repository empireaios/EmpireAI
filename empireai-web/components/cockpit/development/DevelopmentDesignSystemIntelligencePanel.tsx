"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type DesignSystemPayload = {
  designSystemIntelligence?: {
    computedAt: string;
    engine: {
      status: string;
      performance: {
        totalAnalyses: number;
        totalComponentsDiscovered: number;
        totalDeviationsDetected: number;
      };
      health: { status: string; healthScore: number };
    };
    readiness: {
      intelligenceStatus: string;
      lastDecision: string | null;
      healthScore: number;
    };
    cockpit: {
      intelligenceStatus: string;
      healthStatus: string;
      designSystemVersion: string | null;
      componentsLearned: number;
      familiesIdentified: number;
      lastDecision: string | null;
      deviationsCount: number;
      totalAnalyses: number;
      recentLogs: string[];
    };
    latestReport: {
      analysisReportId: string;
      model: {
        version: string;
        componentLibrary: { componentId: string; componentName: string; componentFamily: string }[];
        componentFamilies: { familyName: string; variantCount: number }[];
        colorPalette: { name: string; value: string }[];
        typographyStandards: { name: string; fontFamily: string }[];
      };
      validation: {
        decision: string;
        deviations: { category: string; severity: string; description: string }[];
      };
      evolutionSummary: {
        currentVersion: string;
        newComponents: number;
      };
    } | null;
  };
  live?: boolean;
};

/** T2-02 — Design System Intelligence development panel. */
export function DevelopmentDesignSystemIntelligencePanel() {
  const [data, setData] = useState<DesignSystemPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/design-system-intelligence", {
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as DesignSystemPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Design System Intelligence");
    } finally {
      setLoading(false);
    }
  }, []);

  const runAnalysis = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/design-system-intelligence/analyze", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run design system analysis");
    } finally {
      setRunning(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const snapshot = data?.designSystemIntelligence;
  const report = snapshot?.latestReport;

  return (
    <div className="space-y-4">
      <Panel
        title="Design System Intelligence (T2-02)"
        description="Learns the EmpireAI design system and validates component consistency."
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
              onClick={() => void runAnalysis()}
              disabled={running}
            >
              {running ? "Analyzing…" : "Run Analysis"}
            </button>
          </div>
        }
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading && !snapshot ? (
          <p className="text-sm text-muted-foreground">Loading Design System Intelligence…</p>
        ) : snapshot ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="font-medium">{snapshot.engine.status}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Version</p>
              <p className="font-medium">{snapshot.cockpit.designSystemVersion ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Components</p>
              <p className="font-medium">
                {snapshot.cockpit.componentsLearned} · {snapshot.cockpit.familiesIdentified} families
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
        <>
          <Panel title="Learned Design System" description={report.model.version}>
            <div className="mb-4 grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Typography</p>
                <p className="text-sm">{report.model.typographyStandards.map((t) => t.name).join(", ")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Colors</p>
                <p className="text-sm">{report.model.colorPalette.map((c) => c.name).join(", ")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Evolution</p>
                <p className="text-sm">v{report.evolutionSummary.currentVersion} · {report.evolutionSummary.newComponents} new</p>
              </div>
            </div>
            <DataTable
              columns={[
                { key: "componentName", header: "Component" },
                { key: "componentFamily", header: "Family" },
              ]}
              rows={report.model.componentLibrary.map((c) => ({
                componentName: c.componentName,
                componentFamily: c.componentFamily,
              }))}
            />
          </Panel>

          {report.validation.deviations.length > 0 ? (
            <Panel title="Deviations" description={`Decision: ${report.validation.decision}`}>
              <DataTable
                columns={[
                  { key: "category", header: "Category" },
                  { key: "severity", header: "Severity" },
                  { key: "description", header: "Description" },
                ]}
                rows={report.validation.deviations.map((d) => ({
                  category: d.category,
                  severity: d.severity,
                  description: d.description,
                }))}
              />
            </Panel>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
