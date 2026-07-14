"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type ComponentGeneratorPayload = {
  componentGenerator?: {
    computedAt: string;
    engine: {
      status: string;
      performance: { totalGenerations: number; totalComponentsGenerated: number };
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
      componentsCount: number;
      validatedCount: number;
      blockedCount: number;
      duplicatesSkipped: number;
      confidenceScore: number;
      totalGenerations: number;
      recentLogs: string[];
    };
    latestReport: {
      componentGenerationReportId: string;
      records: {
        componentGenerationId: string;
        sourceRecommendationId: string;
        componentName: string;
        componentCategory: string;
        targetFiles: string[];
        generationStatus: string;
        confidenceScore: number;
        generatedVariants: { variantName: string }[];
        generatedStates: { stateName: string }[];
        safetyChecks: { checkName: string; passed: boolean }[];
      }[];
      validation: { decision: string; warnings: string[] };
    } | null;
  };
  live?: boolean;
};

/** T3-02 — Component Generator development panel. */
export function DevelopmentComponentGeneratorPanel() {
  const [data, setData] = useState<ComponentGeneratorPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/component-generator", {
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ComponentGeneratorPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Component Generator");
    } finally {
      setLoading(false);
    }
  }, []);

  const runGenerate = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/component-generator/generate", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate components");
    } finally {
      setRunning(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const snapshot = data?.componentGenerator;
  const report = snapshot?.latestReport;

  return (
    <div className="space-y-4">
      <Panel
        title="Component Generator (T3-02)"
        description="Generates reusable UI components from approved UX recommendations and frontend build plans."
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
              onClick={() => void runGenerate()}
              disabled={running}
            >
              {running ? "Generating…" : "Generate Components"}
            </button>
          </div>
        }
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading && !snapshot ? (
          <p className="text-sm text-muted-foreground">Loading Component Generator…</p>
        ) : snapshot ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Components</p>
              <p className="text-2xl font-bold">{snapshot.cockpit.componentsCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Validated / Blocked</p>
              <p className="font-medium">
                {snapshot.cockpit.validatedCount} / {snapshot.cockpit.blockedCount}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Confidence</p>
              <p className="font-medium">{snapshot.cockpit.confidenceScore}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Generations</p>
              <p className="font-medium">{snapshot.cockpit.totalGenerations}</p>
            </div>
          </div>
        ) : null}
      </Panel>

      {report && report.records.length > 0 ? (
        <>
          <Panel title="Generation Records" description={report.componentGenerationReportId}>
            <DataTable
              columns={[
                { key: "componentName", header: "Component" },
                { key: "category", header: "Category" },
                { key: "status", header: "Status" },
                { key: "confidence", header: "Confidence" },
              ]}
              rows={report.records.map((r) => ({
                componentName: r.componentName,
                category: r.componentCategory,
                status: r.generationStatus,
                confidence: String(r.confidenceScore),
              }))}
            />
          </Panel>
          <Panel title="Recent Logs" description="Component generator activity">
            <ul className="space-y-1 text-sm text-muted-foreground">
              {snapshot?.cockpit.recentLogs.map((log) => (
                <li key={log}>{log}</li>
              ))}
            </ul>
          </Panel>
        </>
      ) : null}
    </div>
  );
}
