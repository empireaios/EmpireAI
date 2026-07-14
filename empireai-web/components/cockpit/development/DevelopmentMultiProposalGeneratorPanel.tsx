"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type MultiProposalPayload = {
  multiProposalGenerator?: {
    computedAt: string;
    engine: {
      status: string;
      performance: { totalGenerations: number; totalProposalsGenerated: number };
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
      totalGenerations: number;
      totalProposals: number;
      categoriesCovered: number;
      confidenceScore: number;
      recentLogs: string[];
    };
    latestReport: {
      proposalGenerationRunReportId: string;
      proposals: Array<{
        proposalId: string;
        proposalCategory: string;
        proposalTitle: string;
        proposalSummary: string;
        proposedUxChange: string;
        expectedUxBenefit: string;
        estimatedImplementationScope: string;
        confidenceScore: number;
        linkedBuilderCapabilities: string[];
      }>;
      validation: { decision: string; categoriesCovered: number; warnings: string[] };
    } | null;
  };
  live?: boolean;
};

/** T4-04 — Multi-Proposal Generator development panel. */
export function DevelopmentMultiProposalGeneratorPanel() {
  const [data, setData] = useState<MultiProposalPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/multi-proposal-generator", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as MultiProposalPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Multi-Proposal Generator");
    } finally {
      setLoading(false);
    }
  }, []);

  const runGenerate = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/multi-proposal-generator/generate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate proposals");
    } finally {
      setRunning(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const snapshot = data?.multiProposalGenerator;
  const proposals = snapshot?.latestReport?.proposals ?? [];

  return (
    <div className="space-y-4">
      <Panel
        title="Multi-Proposal Generator (T4-04)"
        description="Generate multiple redesign options from T4-01/02/03 inputs — options only, no auto-apply."
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
              {running ? "Generating…" : "Generate proposals"}
            </button>
          </div>
        }
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading && !snapshot ? (
          <p className="text-sm text-muted-foreground">Loading Multi-Proposal Generator…</p>
        ) : snapshot ? (
          <div className="mt-3 space-y-3">
            <DataTable
              columns={["Metric", "Value"]}
              rows={[
                ["Mission", snapshot.readiness.missionId],
                ["Engine", snapshot.engine.status],
                ["Health", `${snapshot.engine.health.status} (${snapshot.engine.health.healthScore})`],
                ["Generations", String(snapshot.cockpit.totalGenerations)],
                ["Total proposals", String(snapshot.cockpit.totalProposals)],
                ["Categories covered", String(snapshot.cockpit.categoriesCovered)],
                ["Last decision", snapshot.cockpit.lastDecision ?? "—"],
              ]}
            />
            {proposals.length > 0 ? (
              <div className="space-y-3">
                {proposals.map((p) => (
                  <div key={p.proposalId} className="rounded-md border border-border p-3 text-sm">
                    <p className="font-medium">{p.proposalTitle}</p>
                    <p className="text-muted-foreground">
                      {p.proposalCategory} · {p.estimatedImplementationScope} ·{" "}
                      {Math.round(p.confidenceScore * 100)}% confidence
                    </p>
                    <p className="mt-1">{p.proposalSummary}</p>
                    <p className="mt-1 text-muted-foreground">{p.proposedUxChange}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No proposals generated yet.</p>
            )}
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
