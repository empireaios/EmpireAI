"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type SideBySidePayload = {
  sideBySideComparison?: {
    computedAt: string;
    engine: {
      status: string;
      performance: { totalComparisons: number; totalOptionsCompared: number };
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
      totalComparisons: number;
      optionsCompared: number;
      differenceMarkers: number;
      confidenceScore: number;
      recentLogs: string[];
    };
    latestReport: {
      comparisonRunReportId: string;
      comparison: {
        comparisonId: string;
        comparisonType: string;
        differenceSummary: string;
        confidenceScore: number;
        comparedOptions: Array<{
          optionId: string;
          label: string;
          proposalId: string | null;
          previewBuildId: string | null;
          proposalCategory: string;
        }>;
        visualDifferenceMarkers: Array<{
          markerId: string;
          region: string;
          differenceType: string;
          description: string;
          severity: string;
        }>;
      };
      validation: { decision: string; optionsCompared: number; warnings: string[] };
    } | null;
  };
  live?: boolean;
};

/** T4-05 — Side-by-Side Comparison development panel. */
export function DevelopmentSideBySideComparisonPanel() {
  const [data, setData] = useState<SideBySidePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/side-by-side-comparison", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as SideBySidePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Side-by-Side Comparison");
    } finally {
      setLoading(false);
    }
  }, []);

  const runCompare = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/side-by-side-comparison/compare", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comparisonType: "original_vs_proposal" }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run comparison");
    } finally {
      setRunning(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const snapshot = data?.sideBySideComparison;
  const comparison = snapshot?.latestReport?.comparison;
  const options = comparison?.comparedOptions ?? [];
  const markers = comparison?.visualDifferenceMarkers ?? [];

  return (
    <div className="space-y-4">
      <Panel
        title="Side-by-Side Comparison (T4-05)"
        description="Compare redesign options visually — evaluation only, no auto-apply."
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
              onClick={() => void runCompare()}
              disabled={running}
            >
              {running ? "Comparing…" : "Compare options"}
            </button>
          </div>
        }
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading && !snapshot ? (
          <p className="text-sm text-muted-foreground">Loading Side-by-Side Comparison…</p>
        ) : snapshot ? (
          <div className="mt-3 space-y-3">
            <DataTable
              columns={["Metric", "Value"]}
              rows={[
                ["Mission", snapshot.readiness.missionId],
                ["Engine", snapshot.engine.status],
                ["Health", `${snapshot.engine.health.status} (${snapshot.engine.health.healthScore})`],
                ["Comparisons", String(snapshot.cockpit.totalComparisons)],
                ["Options compared", String(snapshot.cockpit.optionsCompared)],
                ["Difference markers", String(snapshot.cockpit.differenceMarkers)],
                ["Last decision", snapshot.cockpit.lastDecision ?? "—"],
              ]}
            />
            {comparison ? (
              <div className="space-y-3">
                <p className="text-sm">
                  <span className="font-medium">{comparison.comparisonType}</span>
                  {" · "}
                  {Math.round(comparison.confidenceScore * 100)}% confidence
                </p>
                <p className="text-sm text-muted-foreground">{comparison.differenceSummary}</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {options.map((o) => (
                    <div key={o.optionId} className="rounded-md border border-border p-3 text-sm">
                      <p className="font-medium">{o.label}</p>
                      <p className="text-muted-foreground">
                        {o.proposalCategory}
                        {o.proposalId ? ` · ${o.proposalId}` : " · baseline"}
                      </p>
                      {o.previewBuildId ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Preview: {o.previewBuildId}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
                {markers.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Highlighted differences</p>
                    {markers.map((m) => (
                      <div key={m.markerId} className="rounded-md border border-border p-2 text-sm">
                        <p>
                          {m.region} · {m.differenceType} · {m.severity}
                        </p>
                        <p className="text-muted-foreground">{m.description}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No comparison yet. Generate proposals first, then compare options.
              </p>
            )}
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
